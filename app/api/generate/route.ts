import { NextRequest, NextResponse } from "next/server";
import { mockAIResponse } from "@/lib/promptHelpers";

export async function POST(req: NextRequest) {
    try {
        const { prompt, model = "GPT-4", temperature = 0.7 } = await req.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Mock delay based on temperature (higher temp = more "creative" = slightly longer)
        const delay = 1200 + temperature * 800;

        const response = await mockAIResponse(prompt, model, delay);

        return NextResponse.json({
            output: response,
            model,
            tokens: {
                input: Math.ceil(prompt.length / 4),
                output: Math.ceil(response.length / 4),
                total: Math.ceil((prompt.length + response.length) / 4),
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            { error: `Failed to generate response: ${error}` },
            { status: 500 }
        );
    }
}
