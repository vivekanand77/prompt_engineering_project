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

    // The user has specified to use NVIDIA's hosted version of OpenAI-style models
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [{ role: "user", content: prompt }],
            temperature: Math.min(temperature, 1.0), // Nvidia docs suggest 1.0 max
            top_p: 1.0,
            max_tokens: 4096,
            stream: false,
        }),
    });

    if (!res.ok) throw new Error(`NVIDIA OpenAI error: ${res.statusText}`);
    const data = await res.json();

    // Support reasoning_content if present (thinking models)
    const choice = data.choices[0].message;
    const output = choice.reasoning_content
        ? `<thinking>\n${choice.reasoning_content}\n</thinking>\n\n${choice.content}`
        : choice.content;

    return {
        output,
        usage: {
            input: data.usage?.prompt_tokens || Math.ceil(prompt.length / 4),
            output: data.usage?.completion_tokens || 100,
            total: data.usage?.total_tokens || 500,
        },
    };
}

async function callGemini(prompt: string, temperature: number) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {

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

async function callNvidia(prompt: string, temperature: number) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "qwen/qwen2.5-72b-instruct",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4096,
            temperature,
            top_p: 0.95,
            stream: false,
        }),
    });

    if (!res.ok) throw new Error(`NVIDIA error: ${res.statusText}`);
    const data = await res.json();

    // Strip any residual <think>...</think> blocks that some models emit
    const rawContent: string = data.choices[0].message.content ?? "";
    const output = rawContent.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim();

    return {
        output,
        usage: {
            input: data.usage?.prompt_tokens || Math.ceil(prompt.length / 4),
            output: data.usage?.completion_tokens || 100,
            total: data.usage?.total_tokens || 500,
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
        const { prompt, model = "NVIDIA GPT-OSS", temperature = 0.7 } = body;

        if (!prompt || typeof prompt !== "string" || prompt.length > 10_000) {
            return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
        }

        const safeTemp = Math.min(Math.max(Number(temperature) || 0.7, 0), 1);
        let result = null;
        let usedLive = false;

        try {
            if (model.includes("Gemini")) {
                result = await callGemini(prompt, safeTemp);
            } else if (model.includes("Qwen") || (model.includes("NVIDIA") && !model.includes("GPT-OSS"))) {
                result = await callNvidia(prompt, safeTemp);
            } else if (model.includes("GPT-OSS") || model.includes("GPT")) {
                result = await callOpenAI(prompt, model, safeTemp);
            } else {
                // Local LLM or unknown — fall through to mock
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
