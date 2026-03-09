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
    if (!prompt || prompt.trim().length < 5) return 0;

    let score = 0;
    const words = prompt.trim().split(/\s+/);
    const wordCount = words.length;
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lowerPrompt = prompt.toLowerCase();

    // 1. Length & Detail (0-20 points)
    // Short prompts lack context; very long prompts are usually well-detailed
    if (wordCount >= 10) score += 5;
    if (wordCount >= 25) score += 5;
    if (wordCount >= 50) score += 5;
    if (wordCount >= 100) score += 5;

    // 2. Clarity of instruction (0-20 points)
    // Does it have a clear action verb / directive?
    const hasDirective = /\b(write|create|generate|explain|describe|analyze|review|compare|list|summarize|draft|build|design|develop|implement|optimize|evaluate|suggest|recommend|provide|help|act as|you are|imagine)\b/i.test(prompt);
    if (hasDirective) score += 12;
    // Has a question or imperative structure
    const hasQuestion = /\?/.test(prompt);
    if (hasQuestion) score += 4;
    // Multiple sentences suggest structured thought
    if (sentences.length >= 2) score += 4;

    // 3. Specificity & Context (0-20 points)
    // Specific nouns, technical terms, proper nouns
    const hasSpecificTerms = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(prompt); // Proper nouns
    if (hasSpecificTerms) score += 5;
    // Contains numbers, measurements, or quantities
    const hasNumbers = /\b\d+\b/.test(prompt);
    if (hasNumbers) score += 5;
    // Domain-specific keywords or technical terms
    const hasTechnical = /\b(api|database|function|algorithm|component|module|framework|architecture|pattern|protocol|endpoint|schema|model|deploy|pipeline|stack|server|client|frontend|backend|devops|python|javascript|react|sql|css|html|node|docker|aws|firebase|mongodb)\b/i.test(prompt);
    if (hasTechnical) score += 5;
    // Mentions audience, persona, or role
    const hasPersona = /\b(you are|act as|role|persona|audience|user|customer|developer|expert|senior|professional|beginner|student|stakeholder|manager)\b/i.test(prompt);
    if (hasPersona) score += 5;

    // 4. Constraints & Boundaries (0-15 points)
    // Explicit constraints (word limits, format requirements, exclusions)
    const hasConstraints = /\b(must|should|avoid|don't|do not|never|always|ensure|make sure|limit|maximum|minimum|at least|at most|no more than|within|between)\b/i.test(prompt);
    if (hasConstraints) score += 8;
    // Output format specification
    const hasFormat = /\b(json|markdown|bullet|list|table|csv|xml|html|code|paragraph|section|heading|numbered|format|structure|template|schema|example)\b/i.test(prompt);
    if (hasFormat) score += 7;

    // 5. Examples & Structure (0-15 points)
    // Contains examples or demonstrations
    const hasExamples = /\b(example|e\.g\.|for instance|such as|like this|here is|sample|demo|illustration)\b/i.test(prompt);
    if (hasExamples) score += 7;
    // Has structural markers (steps, sections, multi-part)
    const hasStructure = /\b(step|first|second|third|then|finally|next|part \d|section|phase|stage|1\.|2\.|3\.|- |\* )\b/i.test(prompt);
    if (hasStructure) score += 4;
    // Uses line breaks for organization
    const hasLineBreaks = (prompt.match(/\n/g) || []).length >= 2;
    if (hasLineBreaks) score += 4;

    // 6. Tone & Style specification (0-10 points)
    const hasTone = /\b(tone|style|voice|formal|informal|casual|professional|friendly|technical|creative|concise|detailed|academic|conversational|persuasive|authoritative|empathetic|humorous)\b/i.test(prompt);
    if (hasTone) score += 5;
    // Sensory or descriptive language (for creative prompts)
    const hasSensory = /\b(vivid|sensory|imagery|emotion|feel|texture|atmosphere|mood|color|sound|smell|taste|touch|visual|auditory)\b/i.test(prompt);
    if (hasSensory) score += 5;

    return Math.min(score, 100);
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

/**
 * Extract key topics/keywords from a prompt for context-aware mock responses
 */
function extractPromptContext(prompt: string): { topic: string; keywords: string[]; isCode: boolean; isList: boolean; isCreative: boolean } {
    const words = prompt.toLowerCase().split(/\s+/);
    const isCode = /code|function|script|component|api|sql|query|debug|refactor|bug|error|class|module/i.test(prompt);
    const isList = /list|steps|itinerary|checklist|generate \d|create \d|top \d|tagline/i.test(prompt);
    const isCreative = /write|story|creative|imagine|poem|essay|letter|blog|article|leonardo|persona/i.test(prompt);

    // Extract meaningful keywords (skip common words)
    const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "need", "dare", "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "because", "but", "and", "or", "if", "while", "that", "this", "it", "its", "my", "your", "you", "i", "me", "we", "they", "them", "their", "what", "which", "who", "whom"]);
    const keywords = words
        .filter(w => w.length > 3 && !stopWords.has(w))
        .slice(0, 8);

    // Get a rough topic from the first meaningful sentence
    const firstLine = prompt.split(/[.\n]/)[0].trim();
    const topic = firstLine.length > 80 ? firstLine.slice(0, 80) + "..." : firstLine;

    return { topic, keywords, isCode, isList, isCreative };
}

/**
 * Generate a context-aware mock response tailored to the model style
 */
function generateContextMock(prompt: string, model: string): string {
    const ctx = extractPromptContext(prompt);
    const keywordStr = ctx.keywords.slice(0, 4).join(", ");
    const promptPreview = prompt.length > 120 ? prompt.slice(0, 120) + "..." : prompt;

    switch (model) {
        case "GPT-4":
            if (ctx.isCode) {
                return `**Analysis of your request**: "${ctx.topic}"\n\nI've reviewed the technical requirements. Here's my structured approach:\n\n**1. Understanding**\nYour prompt focuses on: ${keywordStr}. This is a well-scoped technical task.\n\n**2. Implementation Plan**\n\`\`\`\nStep 1: Parse and understand the input requirements\nStep 2: Design the solution architecture\nStep 3: Implement with best practices (error handling, edge cases)\nStep 4: Review for performance and security\n\`\`\`\n\n**3. Key Considerations**\n- Follow SOLID principles for maintainable code\n- Add proper error handling and input validation\n- Consider edge cases and boundary conditions\n- Optimize for readability and performance\n\n**4. Output**\nThe implementation would follow industry standards with proper documentation and test coverage.\n\n*[Simulated GPT-4 response — connect a live API key for real output]*`;
            }
            if (ctx.isList) {
                return `**Responding to**: "${ctx.topic}"\n\nBased on the parameters you specified (${keywordStr}), here's my structured output:\n\n**1.** A carefully crafted first item that addresses the core theme\n**2.** A creative variation that explores a different angle\n**3.** An innovative approach combining multiple elements\n**4.** A practical option focused on real-world applicability\n**5.** A bold choice that pushes creative boundaries\n\nEach item has been tailored to your specific requirements around ${keywordStr}.\n\n**Rationale**: These options balance creativity with the constraints you outlined in your prompt.\n\n*[Simulated GPT-4 response — connect a live API key for real output]*`;
            }
            return `**Analyzing**: "${ctx.topic}"\n\nI'll address your prompt covering: ${keywordStr}.\n\n**1. Primary Analysis**\nYour request touches on several interconnected areas. The context suggests a multi-dimensional challenge that benefits from a systematic breakdown.\n\n**2. Structured Response**\n- **Core Focus**: ${ctx.keywords[0] || "the main topic"} — this forms the foundation of the response\n- **Supporting Elements**: ${ctx.keywords.slice(1, 3).join(", ") || "additional context"} — these enrich the output\n- **Constraints Applied**: Following the parameters you've set\n\n**3. Recommendations**\nGiven the scope of "${ctx.topic}", I recommend an iterative approach that validates assumptions at each stage.\n\n*[Simulated GPT-4 response — connect a live API key for real output]*`;

        case "Gemini Pro":
            if (ctx.isCode) {
                return `Analyzing your technical request...\n\n**Prompt**: "${ctx.topic}"\n\n**Technical Breakdown:**\n\n• **Domain**: ${keywordStr}\n• **Type**: Code generation / technical analysis\n• **Complexity**: Moderate to high\n\n**Approach:**\n\n1. **Parse Requirements** — Identify the core technical goals from your prompt\n2. **Architecture Design** — Choose appropriate patterns and data structures\n3. **Implementation** — Write clean, documented code following best practices\n4. **Validation** — Test against edge cases and performance benchmarks\n\n**Key Technical Decisions:**\n- Use modern syntax and patterns\n- Implement comprehensive error handling\n- Follow the principle of least surprise\n- Document public interfaces\n\n**Output Format**: Structured code with inline comments explaining key decisions.\n\n*[Simulated Gemini Pro response — connect a live API key for real output]*`;
            }
            if (ctx.isList) {
                return `Processing: "${ctx.topic}"\n\n**Identified Parameters**: ${keywordStr}\n\n**Generated Items:**\n\n• **Item 1**: Directly addresses your primary requirement with focus on ${ctx.keywords[0] || "the main theme"}\n• **Item 2**: Explores a creative angle related to ${ctx.keywords[1] || "your topic"}\n• **Item 3**: Combines practical utility with the constraints you specified\n• **Item 4**: A unique perspective that differentiates from standard approaches\n• **Item 5**: Synthesizes all elements for maximum impact\n\n**Quality Metrics:**\n- Relevance to prompt: High\n- Creativity score: Above average\n- Constraint adherence: Full compliance\n\n*[Simulated Gemini Pro response — connect a live API key for real output]*`;
            }
            return `Processing your request...\n\n**Input Analysis**: "${ctx.topic}"\n**Key Topics**: ${keywordStr}\n\n**Structured Response:**\n\n• **Finding 1**: Your prompt's focus on ${ctx.keywords[0] || "this topic"} aligns with established best practices in the field\n• **Finding 2**: The relationship between ${ctx.keywords[0] || "the primary topic"} and ${ctx.keywords[1] || "secondary elements"} suggests an integrated approach\n• **Finding 3**: Given the constraints, a phased methodology would optimize results\n\n**Synthesis:**\nCombining these findings with your stated requirements around ${keywordStr}, the optimal path forward involves structured iteration with validation checkpoints.\n\n**Confidence Level**: High — your prompt provides sufficient context for a well-grounded response.\n\n*[Simulated Gemini Pro response — connect a live API key for real output]*`;

        case "NVIDIA Qwen":
            if (ctx.isCode) {
                return `<think>\nThe user is asking about: ${ctx.topic}\nKey technical areas: ${keywordStr}\nI need to provide a technical solution with proper structure.\n</think>\n\n## Technical Response\n\n**Request**: ${ctx.topic}\n\nHere's my analysis of the technical requirements:\n\n### Architecture\nBased on the requirements (${keywordStr}), I recommend:\n\n\`\`\`\n1. Module structure with clear separation of concerns\n2. Input validation layer\n3. Core processing logic\n4. Error handling wrapper\n5. Output formatting\n\`\`\`\n\n### Implementation Notes\n- Use type-safe interfaces for all data boundaries\n- Implement retry logic for external calls\n- Add logging at key decision points\n- Follow defensive programming practices\n\n### Quality Checklist\n- [ ] Unit tests for core logic\n- [ ] Integration tests for API boundaries\n- [ ] Error handling for all edge cases\n- [ ] Performance profiling\n\n*[Simulated NVIDIA Qwen response — connect a live API key for real output]*`;
            }
            if (ctx.isList) {
                return `<think>\nThe user wants a list/enumeration related to: ${ctx.topic}\nFocusing on: ${keywordStr}\n</think>\n\n## Response to: "${ctx.topic}"\n\nBased on your requirements around ${keywordStr}, here are my recommendations:\n\n### Generated List\n\n1. **Option A**: Focused on ${ctx.keywords[0] || "the primary theme"} — prioritizes directness and clarity\n2. **Option B**: Emphasizes ${ctx.keywords[1] || "key aspects"} — creative angle with practical grounding\n3. **Option C**: Combines multiple elements from your prompt for comprehensive coverage\n4. **Option D**: Takes an unconventional approach to stand out\n5. **Option E**: Balanced synthesis of all requirements\n\n### Selection Criteria\nEach option was evaluated against your stated parameters. Options A and C score highest for alignment with your prompt's ${keywordStr} focus.\n\n*[Simulated NVIDIA Qwen response — connect a live API key for real output]*`;
            }
            return `<think>\nAnalyzing the prompt: "${ctx.topic}"\nKey areas to address: ${keywordStr}\n</think>\n\n## Analysis\n\n**Your Prompt**: "${ctx.topic}"\n\nI'll address the key aspects of your request:\n\n### Key Points\n\n1. **${ctx.keywords[0] || "Primary Topic"}**: This forms the core of your request. The approach should be systematic and grounded in established methodology.\n\n2. **${ctx.keywords[1] || "Supporting Context"}**: This enriches the response by providing additional dimensions to consider.\n\n3. **${ctx.keywords[2] || "Implementation"}**: Practical execution requires careful planning and iterative refinement.\n\n### Recommendation\n\nGiven the scope of your prompt focusing on ${keywordStr}, I suggest a structured approach:\n- Start with clear definitions and scope\n- Apply domain-specific best practices\n- Iterate based on feedback and results\n- Validate against your stated constraints\n\n### Summary\nYour prompt is well-structured. The response above addresses the main themes while respecting the boundaries you've established.\n\n*[Simulated NVIDIA Qwen response — connect a live API key for real output]*`;

        case "Claude 3":
            return `I've carefully considered your prompt: "${ctx.topic}"\n\nThis touches on several important areas, particularly around ${keywordStr}. Let me walk through my reasoning:\n\n**First**, it's worth establishing the baseline. Your request involves ${ctx.keywords[0] || "a clearly defined topic"}, which sets the stage for a focused response.\n\n**Second**, the relationship between ${ctx.keywords[0] || "your primary topic"} and ${ctx.keywords[1] || "the broader context"} is worth exploring — it suggests that a nuanced approach will yield better results than a surface-level treatment.\n\n**Third**, considering your stated requirements, I'd structure the output to prioritize clarity and actionability.\n\n**My Recommendation**: An iterative approach that balances depth with practical applicability. Start with the fundamentals around ${keywordStr}, then build out from there.\n\n*[Simulated Claude 3 response — connect a live API key for real output]*`;

        default:
            return `Processing your prompt: "${ctx.topic}"\n\nKey areas identified: ${keywordStr}\n\nThe response has been generated based on your input parameters. Key themes from your prompt have been analyzed and incorporated into this output.\n\n*[Simulated response — connect a live API key for real output]*`;
    }
}

export async function mockAIResponse(
    prompt: string,
    model: string = "GPT-4",
    delay: number = 1500
): Promise<string> {
    // Simulate variable latency per model
    const modelDelays: Record<string, number> = {
        "GPT-4": 800,
        "Gemini Pro": 600,
        "NVIDIA Qwen": 1000,
        "Claude 3": 900,
        "Local LLM": 400,
    };
    const baseDelay = modelDelays[model] || delay;
    await new Promise((r) => setTimeout(r, baseDelay + Math.random() * 500));

    return generateContextMock(prompt, model);
}

export function countTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 chars
    return Math.ceil(text.length / 4);
}
export const DEFAULT_PROMPTS = [
    "You are a Senior Python Developer. Review this recursive Fibonacci function for performance bottlenecks and suggest optimizations:\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(40))",
    "Generate 5 high-impact marketing taglines for a new sustainable sneakers brand called 'EcoStep'. Focus on comfort and zero-carbon footprint.",
    "Act as a Socratic teacher. Help me understand the concept of Quantum Entanglement by asking me three guided questions instead of giving a direct explanation.",
    "Draft a React functional component for a dynamic data table with sorting and filtering capabilities using only vanilla CSS and standard hooks.",
    "You are Leonardo da Vinci. Respond to a curious 21st-century child who just asked you how you feel about modern airplanes.",
    "Create a detailed 3-day travel itinerary for a first-time visitor to Tokyo who loves hidden gems, cyberpunk aesthetics, and street food.",
    "Write a robust Bash script that backs up a directory to a remote server via rsync, handles errors, and sends an email notification on failure.",
    "Explain the difference between REST and GraphQL APIs. Include pros, cons, and when to use each. Give a concrete example of a query in both.",
    "You are a cybersecurity analyst. A company's web application has a login page. List the top 5 security vulnerabilities you would test for and how to mitigate each.",
    "Compare microservices vs monolithic architecture for a startup building an e-commerce platform. Consider team size of 4 developers, budget constraints, and need for rapid iteration."
];

export function checkLiveMode() {
    return {
        openai: !!process.env.OPENAI_API_KEY,
        google: !!process.env.GOOGLE_AI_API_KEY,
        nvidia: !!(process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY),
    };
}
