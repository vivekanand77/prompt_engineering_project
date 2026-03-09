import { NextRequest, NextResponse } from "next/server";
import { mockAIResponse } from "@/lib/promptHelpers";
import { generateRateLimiter, getClientIP } from "@/lib/rateLimiter";
import { isAppError, APIError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getConfig, API_CONSTANTS } from "@/lib/config";
import {
  validateGenerateRequest,
  type AIProviderResponse,
  type OpenAIProviderResponse,
  type GeminiProviderResponse,
  type QwenProviderResponse,
  type GenerateResponse,
} from "@/lib/types";
import { fetchWithRetry, safeJSONParse } from "@/lib/apiUtils";

// ─── AI Provider Helpers ─────────────────────────────────────────────────────

async function callOpenAI(
  prompt: string,
  model: string,
  temperature: number,
  maxTokens: number
): Promise<AIProviderResponse | null> {
  const config = getConfig();
  if (!config.OPENAI_API_KEY) return null;

  const startTime = Date.now();

  try {
    // OPENAI_API_KEY holds an NVIDIA-hosted key — route to NVIDIA endpoint
    const res = await fetchWithRetry("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: Math.min(temperature, API_CONSTANTS.MAX_TEMPERATURE),
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new APIError(`OpenAI/NVIDIA error: ${res.statusText}`, "OpenAI", res.status);
    }

    const data = safeJSONParse<OpenAIProviderResponse>(await res.text(), {} as OpenAIProviderResponse);

    if (!data.choices?.[0]?.message?.content) {
      throw new APIError("Invalid response from OpenAI API", "OpenAI");
    }

    const durationMs = Date.now() - startTime;
    logger.logExternalAPI("OpenAI", true, durationMs, { model });

    return {
      output: data.choices[0].message.content,
      usage: {
        input: data.usage?.prompt_tokens || Math.ceil(prompt.length / API_CONSTANTS.CHARS_PER_TOKEN),
        output: data.usage?.completion_tokens || Math.ceil(data.choices[0].message.content.length / API_CONSTANTS.CHARS_PER_TOKEN),
        total: data.usage?.total_tokens || Math.ceil((prompt.length + data.choices[0].message.content.length) / API_CONSTANTS.CHARS_PER_TOKEN),
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.logExternalAPI("OpenAI", false, durationMs, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

async function callGemini(
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<AIProviderResponse | null> {
  const config = getConfig();
  if (!config.GOOGLE_AI_API_KEY) return null;

  const startTime = Date.now();

  try {
    // FIX: Move API key to header instead of URL to prevent logging
    const res = await fetchWithRetry(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.GOOGLE_AI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );

    if (!res.ok) {
      throw new APIError(`Gemini error: ${res.statusText}`, "Gemini", res.status);
    }

    const data = safeJSONParse<GeminiProviderResponse>(await res.text(), {} as GeminiProviderResponse);

    // FIX: Handle safety filters and empty candidates
    if (!data.candidates || data.candidates.length === 0) {
      throw new APIError("Gemini returned no candidates (possibly filtered by safety)", "Gemini");
    }

    const candidate = data.candidates[0];
    if (!candidate.content?.parts?.[0]?.text) {
      throw new APIError("Invalid response structure from Gemini API", "Gemini");
    }

    const output = candidate.content.parts[0].text;
    const durationMs = Date.now() - startTime;
    logger.logExternalAPI("Gemini", true, durationMs);

    return {
      output,
      usage: {
        input: Math.ceil(prompt.length / API_CONSTANTS.CHARS_PER_TOKEN),
        output: Math.ceil(output.length / API_CONSTANTS.CHARS_PER_TOKEN),
        total: Math.ceil((prompt.length + output.length) / API_CONSTANTS.CHARS_PER_TOKEN),
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.logExternalAPI("Gemini", false, durationMs, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

async function callQwen(
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<AIProviderResponse | null> {
  const config = getConfig();
  if (!config.NVIDIA_API_KEY) return null;

  const startTime = Date.now();

  try {
    const res = await fetchWithRetry("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b",
        messages: [{ role: "user", content: prompt }],
        temperature: Math.min(temperature, API_CONSTANTS.MAX_TEMPERATURE),
        top_p: 0.95,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new APIError(`Qwen error: ${res.statusText}`, "Qwen", res.status);
    }

    const data = safeJSONParse<QwenProviderResponse>(await res.text(), {} as QwenProviderResponse);

    if (!data.choices?.[0]?.message?.content) {
      throw new APIError("Invalid response from Qwen API", "Qwen");
    }

    const output = data.choices[0].message.content;
    const durationMs = Date.now() - startTime;
    logger.logExternalAPI("Qwen", true, durationMs);

    return {
      output,
      usage: {
        input: data.usage?.prompt_tokens || Math.ceil(prompt.length / API_CONSTANTS.CHARS_PER_TOKEN),
        output: data.usage?.completion_tokens || Math.ceil(output.length / API_CONSTANTS.CHARS_PER_TOKEN),
        total: data.usage?.total_tokens || Math.ceil((prompt.length + output.length) / API_CONSTANTS.CHARS_PER_TOKEN),
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.logExternalAPI("Qwen", false, durationMs, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// ─── Main Route ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<GenerateResponse | { error: string }>> {
  const startTime = Date.now();
  const ip = getClientIP(req.headers);

  try {
    logger.logRequest("POST", "/api/generate", ip);

    // FIX: Check Content-Length to prevent DOS
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
      throw new ValidationError("Request body too large. Maximum 1MB.");
    }

    // Rate limiting
    generateRateLimiter.check(ip);

    // FIX: Parse and validate request - handle JSON parsing errors
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      throw new ValidationError("Invalid JSON in request body");
    }

    const validation = validateGenerateRequest(body);

    if (!validation.success) {
      throw new ValidationError(validation.error || "Invalid request");
    }

    // FIX: Proper type guard instead of assertion
    if (!validation.data) {
      throw new ValidationError("Validation succeeded but no data present");
    }

    const { prompt, model = "NVIDIA Qwen", temperature = API_CONSTANTS.DEFAULT_TEMPERATURE, maxTokens = API_CONSTANTS.DEFAULT_TOKENS_OUTPUT } = validation.data;

    // Validate prompt length
    if (prompt.length > API_CONSTANTS.MAX_PROMPT_LENGTH) {
      throw new ValidationError(`Prompt too long. Maximum ${API_CONSTANTS.MAX_PROMPT_LENGTH} characters.`);
    }

    // Clamp values
    const safeTemp = Math.min(Math.max(temperature, API_CONSTANTS.MIN_TEMPERATURE), API_CONSTANTS.MAX_TEMPERATURE);
    const safeMaxTokens = Math.min(Math.max(maxTokens || API_CONSTANTS.DEFAULT_TOKENS_OUTPUT, API_CONSTANTS.MIN_TOKENS_OUTPUT), API_CONSTANTS.MAX_TOKENS_OUTPUT);

    let result: AIProviderResponse | null = null;
    let usedLive = false;

    // Try live API based on model
    try {
      if (model.includes("Gemini")) {
        result = await callGemini(prompt, safeTemp, safeMaxTokens);
      } else if (model.includes("Qwen") || model.includes("NVIDIA")) {
        result = await callQwen(prompt, safeTemp, safeMaxTokens);
      } else if (model.includes("GPT")) {
        result = await callOpenAI(prompt, model, safeTemp, safeMaxTokens);
      }

      if (result) usedLive = true;
    } catch (err) {
      logger.warn("Live API call failed, falling back to simulation", { error: err instanceof Error ? err.message : String(err) });
      // Result remains null, will fallback to mock below
    }

    // Fallback to mock response
    if (!result) {
      const mockOut = await mockAIResponse(prompt, model, 800);
      result = {
        output: mockOut,
        usage: {
          input: Math.ceil(prompt.length / API_CONSTANTS.CHARS_PER_TOKEN),
          output: Math.ceil(mockOut.length / API_CONSTANTS.CHARS_PER_TOKEN),
          total: Math.ceil((prompt.length + mockOut.length) / API_CONSTANTS.CHARS_PER_TOKEN),
        },
      };
    }

    const durationMs = Date.now() - startTime;
    logger.logResponse("POST", "/api/generate", 200, durationMs, { model, usedLive });

    // FIX: Add rate limit headers
    const remaining = generateRateLimiter.getRemaining(ip);
    const response: GenerateResponse = {
      output: result.output,
      model,
      live: usedLive,
      tokens: result.usage,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        "X-RateLimit-Limit": API_CONSTANTS.RATE_LIMIT_MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(Date.now() + API_CONSTANTS.RATE_LIMIT_WINDOW_MS).toISOString(),
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;

    if (isAppError(error)) {
      logger.logResponse("POST", "/api/generate", error.statusCode, durationMs, { error: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Unexpected error in /api/generate", error);
    logger.logResponse("POST", "/api/generate", 500, durationMs);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
