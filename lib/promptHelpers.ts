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
    "Local LLM": [
        "Processing prompt...\n\nResponse generated:\n\nI have analyzed your input according to the specified parameters. The output follows your requested format and adheres to the stated constraints. This response has been generated with consideration for efficiency and accuracy.",
    ],
};

// Detect the high-level intent of a prompt so mock responses can adapt.
function detectPromptIntent(prompt: string): "code" | "creative" | "analysis" | "list" | "general" {
    if (/\b(code|function|class|script|implement|debug|refactor|sql|python|javascript|typescript|react|bash|api|component|query)\b/i.test(prompt)) return "code";
    if (/\b(write|story|poem|tagline|creative|draft|describe|narrat|song|essay)\b/i.test(prompt)) return "creative";
    if (/\b(analyz|review|evaluat|assess|compar|explain|summariz|break\s*down)\b/i.test(prompt)) return "analysis";
    if (/\b(list|give me \d|top \d|multiple|several|\d+ ways|\d+ tips)\b/i.test(prompt)) return "list";
    return "general";
}

export async function mockAIResponse(
    prompt: string,
    model: string = "GPT-4",
    delay: number = 1500
): Promise<string> {
    await new Promise((r) => setTimeout(r, delay + Math.random() * 1000));

    // Route to context-aware templates for Qwen and Gemini.
    // Model names come from the MODELS constant in app/comparator/page.tsx:
    //   "NVIDIA Qwen" → includes("Qwen")
    //   "Gemini Pro"  → includes("Gemini")
    // This mirrors the same model routing used in app/api/generate/route.ts.
    if (!model.includes("Qwen") && !model.includes("Gemini")) {
        const responses = MOCK_RESPONSES[model] || MOCK_RESPONSES["GPT-4"];
        const base = responses[Math.floor(Math.random() * responses.length)];
        const suffix = prompt.split(" ").length > 50
            ? "\n\n*Note: This response has been tailored to your detailed prompt specification.*"
            : "";
        return base + suffix;
    }

    // ── Context-aware simulation for Qwen and Gemini ──────────────
    const trimmed = prompt.trim();
    const firstSentence = trimmed.split(/[.!?\n]/)[0].slice(0, 120);
    const intent = detectPromptIntent(trimmed);

    if (model.includes("Gemini")) {
        switch (intent) {
            case "code":
                return `**Gemini — Code Analysis**\n\nTask: *"${firstSentence}..."*\n\n• **Scope**: Code-related task — reviewing all requirements from your prompt\n• **Context absorbed**: Applying domain-specific best practices\n• **Approach**: Structured analysis with attention to correctness and maintainability\n\n**Recommendations based on your prompt:**\n\n1. Break the implementation into small, testable units as described\n2. Address the edge cases implied by your constraints\n3. Format the output exactly as you specified\n\n*[Simulated response — set GOOGLE_AI_API_KEY for live Gemini output]*`;
            case "creative":
                return `**Gemini — Creative Response**\n\nBrief: *"${firstSentence}..."*\n\n• **Tone & style**: Captured from your prompt\n• **Audience**: Inferred from context\n• **Format**: Adapted to your output requirements\n\n**Output tailored to your brief:**\n\nBuilding directly on the parameters you've described, this response matches your creative goal while respecting every constraint you've outlined. The language and structure align with the tone you specified.\n\n*[Simulated response — set GOOGLE_AI_API_KEY for live Gemini output]*`;
            case "analysis":
                return `**Gemini — Analysis**\n\nAnalyzing: *"${firstSentence}..."*\n\n• **Finding 1**: The primary objective in your prompt is clear — responding accordingly\n• **Finding 2**: Context and constraints from your prompt have been absorbed\n• **Finding 3**: Output format requirements will be respected\n\n**Detailed breakdown:**\n\nBased on the context you provided, this targeted response addresses your specific goal rather than giving a generic answer. Each point is derived directly from the information in your prompt.\n\n*[Simulated response — set GOOGLE_AI_API_KEY for live Gemini output]*`;
            case "list":
                return `**Gemini — Structured List**\n\nRequest: *"${firstSentence}..."*\n\n1. **First item** — directly relevant to what you asked\n2. **Second item** — building on your stated context\n3. **Third item** — addressing a constraint from your prompt\n4. **Fourth item** — derived from your output requirements\n5. **Fifth item** — summary point aligned with your goal\n\n*[Simulated response — set GOOGLE_AI_API_KEY for live Gemini output]*`;
            default:
                return `**Gemini — Response**\n\nAddressing: *"${firstSentence}..."*\n\n• **Key point 1**: Directly addresses your stated objective\n• **Key point 2**: Considers the context you provided\n• **Key point 3**: Formatted per your output requirements\n\n**Answer:**\n\nBased on the specific details in your prompt, this response is shaped by your context — not a generic template. It accounts for the tone, format, and constraints you outlined.\n\n*[Simulated response — set GOOGLE_AI_API_KEY for live Gemini output]*`;
        }
    }

    // Qwen
    switch (intent) {
        case "code":
            return `**Qwen — Technical Analysis**\n\nRequest: *"${firstSentence}..."*\n\n**Step-by-step reasoning:**\n\n1. **Understand the task** — Code-related goal identified from your prompt\n2. **Note constraints** — Limitations and requirements absorbed from context\n3. **Formulate solution** — Applying systematic reasoning\n\n**Recommendation:**\n\nGiven the specifics of your prompt, the most effective approach addresses each component you outlined. The solution is optimized for the environment and constraints you described.\n\n\`\`\`\n# Outline based on your prompt\n# 1. Primary requirement: ${firstSentence.slice(0, 60)}...\n# 2. Handle edge cases from your constraints\n# 3. Validate against your output format\n\`\`\`\n\n*[Simulated response — set NVIDIA_API_KEY for live Qwen output]*`;
        case "list":
            return `**Qwen — Structured Response**\n\nProcessing: *"${firstSentence}..."*\n\n→ Identified goal from your prompt\n→ Noted context and constraints\n→ Building a targeted list\n\n**Output:**\n\n1. First point — directly relevant to "${firstSentence.slice(0, 40)}..."\n2. Second point — from your stated context\n3. Third point — aligned with your constraints\n4. Fourth point — matches your output format\n5. Fifth point — closing recommendation\n\n*[Simulated response — set NVIDIA_API_KEY for live Qwen output]*`;
        default:
            return `**Qwen — Chain-of-Thought Response**\n\nProcessing: *"${firstSentence}..."*\n\n→ Reading your prompt context\n→ Key elements identified: ${intent === "creative" ? "creative brief, tone, audience" : intent === "analysis" ? "subject, evaluation criteria, output format" : "goal, context, constraints"}\n→ Composing a response matched to your requirements\n\n**Answer:**\n\nBased on what you specified, this response directly addresses your prompt rather than giving a generic reply. It accounts for the tone, format, and constraints you outlined, providing relevant and targeted information.\n\n*[Simulated response — set NVIDIA_API_KEY for live Qwen output]*`;
    }
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
