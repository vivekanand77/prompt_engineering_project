import { NextRequest, NextResponse } from "next/server";
import { scorePrompt } from "@/lib/promptHelpers";

const RATE_LIMIT_MAP = new Map<string, number[]>();
const WINDOW = 60_000;
const MAX = 30; // 30 scores per minute

function isLimited(ip: string) {
    const now = Date.now();
    const ts = RATE_LIMIT_MAP.get(ip) ?? [];
    const recent = ts.filter(t => now - t < WINDOW);
    recent.push(now);
    RATE_LIMIT_MAP.set(ip, recent);
    return recent.length > MAX;
}

async function getAIScore(prompt: string) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY;
    if (!apiKey) return null;

    const systemPrompt = "You are an expert Prompt Engineer. Rate the user's prompt on a scale of 0 to 100 based on clarity, context, constraints, and goal-setting. Return ONLY a JSON object: { \"score\": number, \"feedback\": \"3-5 word critique\" }. No other text.";

    try {
        if (process.env.GOOGLE_AI_API_KEY) {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {

                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nPrompt to evaluate: "${prompt}"` }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
                }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            const text = data.candidates[0].content.parts[0].text;
            return JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
        } else if (process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY) {
            const key = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
            const model = process.env.NVIDIA_API_KEY ? "qwen/qwen3.5-397b-a17b" : "openai/gpt-oss-20b";
            const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
                    temperature: 0.1,
                }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            const content = data.choices[0].message.content;
            return JSON.parse(content.match(/\{[\s\S]*\}/)[0]);
        }
    } catch {
        return null;
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        if (isLimited(ip)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

        const { prompt } = await req.json();
        if (!prompt || typeof prompt !== "string") return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });

        const aiResult = await getAIScore(prompt);

        if (aiResult) {
            return NextResponse.json({ ...aiResult, live: true });
        }

        // Fallback to enhanced local heuristic
        const result = scorePrompt(prompt);
        return NextResponse.json({
            score: result.score,
            feedback: result.feedback,
            suggestions: result.suggestions,
            live: false
        });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
