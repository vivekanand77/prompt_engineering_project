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

export interface ScoreResult {
    score: number;
    feedback: string;
    suggestions: string[];
}

export function scorePrompt(prompt: string): ScoreResult {
    let score = 0;
    const suggestions: string[] = [];
    const trimmed = prompt.trim();
    const words = trimmed.split(/\s+/).filter(Boolean).length;

    // 1. Component Checks (Structural)
    const components = [
        { pattern: /GOAL|objective|task|achieve|want to/i, label: "Goal", weight: 20 },
        { pattern: /CONTEXT|background|situation|industry|company/i, label: "Context", weight: 15 },
        { pattern: /OUTPUT|format|structure|layout|markdown|json/i, label: "Output Format", weight: 15 },
        { pattern: /CONSTRAINT|limit|rule|must not|avoid|without/i, label: "Constraints", weight: 15 },
        { pattern: /tone|style|voice|persona|act as|you are/i, label: "Persona/Tone", weight: 15 },
        { pattern: /example|instance|show me|case study/i, label: "Examples", weight: 10 },
    ];

    for (const comp of components) {
        if (comp.pattern.test(prompt)) {
            score += comp.weight;
        } else if (comp.weight >= 15) {
            suggestions.push(`Missing clear **${comp.label}**`);
        }
    }

    // 2. Length/Detail Heuristic
    if (words < 10) {
        score -= 20;
        suggestions.push("Prompt is too short; add more detail");
    } else if (words > 30 && words < 300) {
        score += 10;
    }

    // 3. Instruction Clarity (Action Verbs)
    const actionVerbs = /^(write|create|explain|analyze|summarize|draft|build|generate|review)/i;
    if (actionVerbs.test(trimmed)) {
        score += 10;
    } else {
        suggestions.push("Start with a strong action verb (e.g., 'Analyze' or 'Create')");
    }

    // Normalized Score
    const finalScore = Math.max(0, Math.min(score, 100));

    // Feedback Logic
    let feedback = "Basic structure";
    if (finalScore >= 80) feedback = "Excellent prompt engineering";
    else if (finalScore >= 60) feedback = "Effective and clear";
    else if (finalScore >= 40) feedback = "Fair, but needs detail";
    else feedback = "Needs significant detail";

    return {
        score: finalScore,
        feedback,
        suggestions: suggestions.slice(0, 3) // Return top 3 hints
    };
}

export function getScoreLabel(score: number): {
    label: string;
    color: string;
} {
    if (score >= 80) return { label: "Excellent", color: "var(--success)" };
    if (score >= 60) return { label: "Good", color: "var(--text-primary)" };
    if (score >= 40) return { label: "Fair", color: "var(--text-secondary)" };
    return { label: "Needs Work", color: "var(--error)" };
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
export const DEFAULT_PROMPTS = [
    "You are a Senior Python Developer. Review the following code for performance bottlenecks and provide specific refactoring suggestions:\n\n[PASTE CODE HERE]",
    "Act as a professional creative writing coach. Read my short story snippet and provide feedback on character voice and sensory descriptions:\n\n[PASTE STORY HERE]",
    "Generate 5 high-impact marketing taglines for a new sustainable sneakers brand called 'EcoStep'. Focus on comfort and zero-carbon footprint.",
    "Summarize this technical documentation for a non-technical stakeholder. Focus on business value and expected outcomes:\n\n[PASTE DOC HERE]",
    "You are an expert SQL Optimizer. Explain why this query might be slow and provide an optimized version using appropriate indexes:\n\n[PASTE SQL HERE]",
    "Act as a Socratic teacher. Help me understand the concept of Quantum Entanglement by asking me three guided questions instead of giving a direct explanation.",
    "Draft a React functional component for a dynamic data table with sorting and filtering capabilities using only vanilla CSS and standard hooks.",
    "You are Leonardo da Vinci. Respond to a curious 21st-century child who just asked you how you feel about modern airplanes.",
    "Create a detailed 3-day travel itinerary for a first-time visitor to Tokyo who loves hidden gems, cyberpunk aesthetics, and street food.",
    "Write a robust Bash script that backups a directory to a remote server via rsync, handles errors, and sends an email notification on failure."
];

export function checkLiveMode() {
    return {
        openai: !!process.env.OPENAI_API_KEY,
        google: !!process.env.GOOGLE_AI_API_KEY,
        nvidia: !!process.env.NVIDIA_API_KEY,
    };
}
