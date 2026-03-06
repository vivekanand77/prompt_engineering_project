import { NextRequest, NextResponse } from "next/server";
import { mockAIResponse } from "@/lib/promptHelpers";

// ─── Simple in-memory rate limiter ───────────────────────────
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) ?? [];
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    recent.push(now);
    rateLimitMap.set(ip, recent);
    return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

// ─── Real Provider Helpers ───────────────────────────────────

async function callOpenAI(prompt: string, model: string, temperature: number) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model.toLowerCase().includes("gpt-4") ? "gpt-4" : "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature,
        }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
    const data = await res.json();
    return {
        output: data.choices[0].message.content,
        usage: {
            input: data.usage.prompt_tokens,
            output: data.usage.completion_tokens,
            total: data.usage.total_tokens,
        },
    };
}

async function callGemini(prompt: string, temperature: number) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens: 1024 },
        }),
    });

    if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);
    const data = await res.json();
    const output = data.candidates[0].content.parts[0].text;
    return {
        output,
        usage: {
            input: Math.ceil(prompt.length / 4),
            output: Math.ceil(output.length / 4),
            total: Math.ceil((prompt.length + output.length) / 4),
        },
    };
}

async function callClaude(prompt: string, temperature: number) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-3-opus-20240229",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
            temperature,
        }),
    });

    if (!res.ok) throw new Error(`Claude error: ${res.statusText}`);
    const data = await res.json();
    return {
        output: data.content[0].text,
        usage: {
            input: data.usage.input_tokens,
            output: data.usage.output_tokens,
            total: data.usage.input_tokens + data.usage.output_tokens,
        },
    };
}

// ─── Main Route ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || req.headers.get("x-real-ip")
            || "unknown";

        if (isRateLimited(ip)) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await req.json();
        const { prompt, model = "GPT-4", temperature = 0.7 } = body;

        if (!prompt || typeof prompt !== "string" || prompt.length > 10_000) {
            return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
        }

        const safeTemp = Math.min(Math.max(Number(temperature) || 0.7, 0), 1);
        let result = null;
        let usedLive = false;

        try {
            if (model.includes("GPT")) {
                result = await callOpenAI(prompt, model, safeTemp);
            } else if (model.includes("Gemini")) {
                result = await callGemini(prompt, safeTemp);
            } else if (model.includes("Claude")) {
                result = await callClaude(prompt, safeTemp);
            }

            if (result) usedLive = true;
        } catch (err) {
            console.error("Live API failed, falling back to simulation:", err);
            // Result remains null, will fallback to mock below
        }

        if (!result) {
            const mockOut = await mockAIResponse(prompt, model, 800);
            result = {
                output: mockOut,
                usage: {
                    input: Math.ceil(prompt.length / 4),
                    output: Math.ceil(mockOut.length / 4),
                    total: Math.ceil((prompt.length + mockOut.length) / 4),
                },
            };
        }

        return NextResponse.json({
            output: result.output,
            model,
            live: usedLive,
            tokens: result.usage,
            timestamp: new Date().toISOString(),
        });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
