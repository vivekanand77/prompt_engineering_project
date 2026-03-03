export interface PromptFields {
    goal: string;
    context: string;
    inputData: string;
    outputFormat: string;
    constraints: string;
    tone: string;
    modelType: string;
}

export function buildPrompt(fields: PromptFields): string {
    const sections: string[] = [];

    if (fields.goal) {
        sections.push(`## GOAL\n${fields.goal}`);
    }
    if (fields.context) {
        sections.push(`## CONTEXT\n${fields.context}`);
    }
    if (fields.inputData) {
        sections.push(`## INPUT\nYou will receive: ${fields.inputData}`);
    }
    if (fields.outputFormat) {
        sections.push(`## OUTPUT FORMAT\n${fields.outputFormat}`);
    }
    if (fields.constraints) {
        sections.push(`## CONSTRAINTS\n${fields.constraints}`);
    }
    if (fields.tone) {
        sections.push(`## TONE & STYLE\nRespond in a ${fields.tone} tone.`);
    }
    if (fields.modelType) {
        sections.push(`## TARGET MODEL\nOptimized for: ${fields.modelType}`);
    }

    return sections.join("\n\n");
}

export function scorePrompt(prompt: string): number {
    let score = 0;
    const checks = [
        { pattern: /GOAL|objective|task/i, weight: 20 },
        { pattern: /CONTEXT|background|situation/i, weight: 15 },
        { pattern: /OUTPUT|format|structure/i, weight: 20 },
        { pattern: /CONSTRAINT|limit|rule|must not/i, weight: 15 },
        { pattern: /tone|style|voice/i, weight: 10 },
        { pattern: /example|instance|for instance/i, weight: 10 },
        { pattern: /step|first|then|finally/i, weight: 10 },
    ];

    for (const check of checks) {
        if (check.pattern.test(prompt)) {
            score += check.weight;
        }
    }

    return Math.min(score, 100);
}

export function getScoreLabel(score: number): {
    label: string;
    color: string;
} {
    if (score >= 80) return { label: "Excellent", color: "text-green-400" };
    if (score >= 60) return { label: "Good", color: "text-blue-400" };
    if (score >= 40) return { label: "Fair", color: "text-yellow-400" };
    return { label: "Needs Work", color: "text-red-400" };
}

const MOCK_RESPONSES: Record<string, string[]> = {
    "GPT-4": [
        "Based on your prompt, here's my analysis:\n\nThe approach you've outlined is methodologically sound. I'll break this down into structured components:\n\n**1. Primary Analysis**\nYour request encompasses several key dimensions that require careful consideration. The context you've provided suggests a multi-layered challenge.\n\n**2. Recommended Approach**\n- Start with the fundamentals\n- Build iteratively\n- Validate at each stage\n\n**3. Expected Outcomes**\nFollowing this framework should yield measurable results within the defined constraints.",
        "Understood. Let me provide a comprehensive response:\n\nThe task requires balancing multiple competing priorities. Here's a structured framework:\n\n```\nStep 1: Define scope\nStep 2: Identify key variables\nStep 3: Apply reasoning chain\nStep 4: Validate output\n```\n\nThis approach ensures both accuracy and efficiency in addressing your requirements.",
    ],
    "Claude 3": [
        "I've carefully considered your prompt and here's my response:\n\nThis is a thoughtful question that touches on several important areas. Let me walk through my reasoning:\n\nFirst, it's worth establishing the baseline. The context you've provided helps me understand the specific constraints and goals at play here.\n\nSecond, considering the output format you specified, I'll structure this response to match your exact requirements while maintaining clarity and precision.\n\nThird, I want to flag a few considerations that might affect the approach...",
        "Thank you for the detailed prompt. Here's my analysis:\n\nThe challenge here involves navigating a complex solution space. I'll approach this systematically:\n\n**Core Insight**: The key tension in this problem is between specificity and generalizability.\n\n**My Recommendation**: Given your constraints, I'd suggest a phased approach that allows for iteration and refinement at each stage.",
    ],
    "Gemini Pro": [
        "Analyzing your prompt...\n\nHere's a structured response based on your requirements:\n\n• **Key Finding 1**: The primary objective aligns well with best practices in this domain\n• **Key Finding 2**: The constraints you've set are reasonable and achievable\n• **Key Finding 3**: The output format you specified will work well for this use case\n\nI recommend proceeding with the outlined approach, with minor adjustments for edge cases.",
        "Based on the context provided, here's my response:\n\nThis problem can be decomposed into three main components:\n\n1. **Data gathering** — Collecting relevant inputs\n2. **Processing** — Applying the reasoning framework\n3. **Output generation** — Formatting results per your specification\n\nEach component has been optimized for your stated goal and constraints.",
    ],
    "Local LLM": [
        "Processing prompt...\n\nResponse generated:\n\nI have analyzed your input according to the specified parameters. The output follows your requested format and adheres to the stated constraints. This response has been generated with consideration for efficiency and accuracy.",
    ],
};

export async function mockAIResponse(
    prompt: string,
    model: string = "GPT-4",
    delay: number = 1500
): Promise<string> {
    await new Promise((r) => setTimeout(r, delay + Math.random() * 1000));

    const responses = MOCK_RESPONSES[model] || MOCK_RESPONSES["GPT-4"];
    const response = responses[Math.floor(Math.random() * responses.length)];

    // Add some prompt-aware customization
    const wordCount = prompt.split(" ").length;
    const suffix =
        wordCount > 50
            ? "\n\n*Note: This response has been tailored to your detailed prompt specification.*"
            : "";

    return response + suffix;
}

export function countTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 chars
    return Math.ceil(text.length / 4);
}
