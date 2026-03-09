import { NextRequest, NextResponse } from "next/server";
import { scorePrompt } from "@/lib/promptHelpers";
import { scoreRateLimiter, getClientIP } from "@/lib/rateLimiter";
import { isAppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getConfig } from "@/lib/config";
import { validateScoreRequest, type ScoreResponse } from "@/lib/types";
import { fetchWithRetry, extractJSON } from "@/lib/apiUtils";

interface AIScoreResult {
  score: number;
  feedback: string;
}

async function getAIScore(prompt: string): Promise<AIScoreResult | null> {
  const config = getConfig();

  const systemPrompt =
    "You are an expert Prompt Engineer. Rate the user's prompt on a scale of 0 to 100 based on clarity, specificity, context, constraints, and goal-setting. A well-written natural language prompt with clear instructions should score 70+. Return ONLY a JSON object: { \"score\": number, \"feedback\": \"3-5 word critique\" }. No other text.";

  const startTime = Date.now();

  try {
    // Try NVIDIA first (most reliable)
    if (config.OPENAI_API_KEY) {
      const res = await fetchWithRetry(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "meta/llama-3.3-70b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 150,
            stream: false,
          }),
        }
      );

      if (!res.ok) return null;

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = extractJSON<AIScoreResult>(content);
      if (!parsed || typeof parsed.score !== "number" || typeof parsed.feedback !== "string") {
        return null;
      }

      const durationMs = Date.now() - startTime;
      logger.logExternalAPI("NVIDIA-Score", true, durationMs);

      return parsed;
    } else if (config.GOOGLE_AI_API_KEY) {
      // Fallback to Google Gemini
      const res = await fetchWithRetry(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.GOOGLE_AI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nPrompt to evaluate: "${prompt}"` },
                ],
              },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
          }),
        }
      );

      if (!res.ok) return null;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;

      const parsed = extractJSON<AIScoreResult>(text);
      if (!parsed || typeof parsed.score !== "number" || typeof parsed.feedback !== "string") {
        return null;
      }

      const durationMs = Date.now() - startTime;
      logger.logExternalAPI("Gemini-Score", true, durationMs);

      return parsed;
    }
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.logExternalAPI(
      config.OPENAI_API_KEY ? "NVIDIA-Score" : "Gemini-Score",
      false,
      durationMs,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }

  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse<ScoreResponse | { error: string }>> {
  const startTime = Date.now();
  const ip = getClientIP(req.headers);

  try {
    logger.logRequest("POST", "/api/score", ip);

    // Rate limiting
    scoreRateLimiter.check(ip);

    // Parse and validate request
    const body = await req.json();
    const validation = validateScoreRequest(body);

    if (!validation.success) {
      throw new ValidationError(validation.error || "Invalid request");
    }

    const { prompt } = validation.data!;

    // Try AI-powered scoring first
    const aiResult = await getAIScore(prompt);

    if (aiResult) {
      const durationMs = Date.now() - startTime;
      logger.logResponse("POST", "/api/score", 200, durationMs, { live: true, score: aiResult.score });

      return NextResponse.json({
        ...aiResult,
        live: true,
      });
    }

    // Fallback to local heuristic scoring
    const localScore = scorePrompt(prompt);
    let feedback = "Basic evaluation";

    if (localScore >= 80) {
      feedback = "Well-crafted, detailed prompt";
    } else if (localScore >= 60) {
      feedback = "Good prompt, add specifics";
    } else if (localScore >= 40) {
      feedback = "Add constraints or examples";
    } else if (localScore >= 20) {
      feedback = "Needs more detail and context";
    } else {
      feedback = "Too short or vague";
    }

    const durationMs = Date.now() - startTime;
    logger.logResponse("POST", "/api/score", 200, durationMs, { live: false, score: localScore });

    return NextResponse.json({
      score: localScore,
      feedback,
      live: false,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;

    if (isAppError(error)) {
      logger.logResponse("POST", "/api/score", error.statusCode, durationMs, { error: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Unexpected error in /api/score", error);
    logger.logResponse("POST", "/api/score", 500, durationMs);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
