/* ─── Exercise & Module Definitions ─── */

export interface LessonContent {
    title: string;
    paragraphs: string[];
    keyPoints: string[];
}

export interface ExerciseOption {
    id: string;
    text: string;
}

export interface Exercise {
    type: "quiz" | "fix-prompt" | "token-challenge" | "drag-label";
    question: string;
    description: string;
    options?: ExerciseOption[];
    correctAnswer?: string;
    badPrompt?: string;
    goodPrompt?: string;
    hints?: string[];
}

export interface Module {
    id: string;
    number: number;
    title: string;
    subtitle: string;
    emoji: string;
    color: string;
    estimatedMinutes: number;
    lesson: LessonContent;
    exercise: Exercise;
}

export const MODULES: Module[] = [
    {
        id: "what-is-a-prompt",
        number: 1,
        title: "What is a Prompt?",
        subtitle: "Understanding the fundamental building block of AI interaction",
        emoji: "💡",
        color: "#7c3aed",
        estimatedMinutes: 5,
        lesson: {
            title: "The Prompt — Your Interface to AI",
            paragraphs: [
                "A prompt is simply the text instruction you give to an AI model. Think of it as a conversation starter — but unlike human conversation, the quality of your prompt directly determines the quality of the AI's response.",
                "Every interaction with ChatGPT, Claude, Gemini, or any LLM starts with a prompt. The model has no memory of your intent beyond what you write. If your prompt is vague, the response will be generic. If it's precise and well-structured, you'll get exactly what you need.",
                "A prompt typically has these core components: the ROLE (who the AI should be), the TASK (what it should do), the CONTEXT (background information), the FORMAT (how to structure the output), and CONSTRAINTS (rules and limitations).",
                "Here's the key insight most beginners miss: AI models are pattern-matching machines trained on billions of text examples. When you write a prompt, you're essentially giving the model a pattern to continue. The better your pattern, the better the continuation.",
            ],
            keyPoints: [
                "A prompt is the text input that controls AI behavior",
                "Quality of output is directly proportional to quality of prompt",
                "Core parts: Role, Task, Context, Format, Constraints",
                "AI models continue patterns — your prompt IS the pattern",
            ],
        },
        exercise: {
            type: "quiz",
            question: "Which of these is the MOST important part of a well-structured prompt?",
            description: "Think about what makes AI responses useful vs. generic.",
            options: [
                { id: "a", text: "Using formal language" },
                { id: "b", text: "A clear, specific task description" },
                { id: "c", text: "Making the prompt as long as possible" },
                { id: "d", text: "Adding emoji for clarity" },
            ],
            correctAnswer: "b",
            hints: [
                "Think about what the AI needs most to give a useful response",
                "Length doesn't equal quality — specificity does",
            ],
        },
    },
    {
        id: "anatomy-of-good-prompt",
        number: 2,
        title: "Anatomy of a Good Prompt",
        subtitle: "Learn what separates amateur prompts from professional ones",
        emoji: "🔬",
        color: "#4f46e5",
        estimatedMinutes: 8,
        lesson: {
            title: "The Structure That Gets Results",
            paragraphs: [
                "Let's compare two prompts for the same task — summarizing customer feedback:\n\nBAD: \"Summarize this feedback\"\nGOOD: \"You are a senior product analyst. Summarize the following customer feedback into 3 actionable items, ordered by business impact. Use bullet points. Each item should have a title, supporting evidence from the feedback, and a recommended next step.\"",
                "The difference is night and day. The bad prompt gives the model almost no direction — it could produce anything from a single sentence to a five-paragraph essay. The good prompt specifies WHO the AI is (product analyst), WHAT to do (summarize into actionable items), HOW MANY (3), HOW to order (by impact), WHAT FORMAT (bullet points), and WHAT to include (title, evidence, next step).",
                "Professional prompt engineers use a framework called 'CRISPE': Capacity (role), Request (task), Insight (context), Personality (tone), and Experiment (format). You don't need to memorize acronyms — just remember: the more specific you are about what you want, the less the model has to guess.",
                "One common mistake: over-constraining. If you give 15 rules for a simple email, the model spends all its 'reasoning budget' on following rules rather than being creative. Match constraint density to task complexity.",
            ],
            keyPoints: [
                "Specific prompts produce specific results — vague prompts produce vague results",
                "Always specify: Role, Task, Format, Constraints",
                "The CRISPE framework: Capacity, Request, Insight, Personality, Experiment",
                "Don't over-constrain simple tasks — match rules to complexity",
            ],
        },
        exercise: {
            type: "fix-prompt",
            question: "Fix this prompt to make it professional-grade",
            description: "The prompt below is vague and will produce inconsistent results. Rewrite it to be specific and well-structured. We'll score your version.",
            badPrompt: "Write me some code to sort a list",
            goodPrompt: "You are a senior Python developer. Write a function that sorts a list of dictionaries by a given key. Handle edge cases: empty lists, missing keys, and None values. Include type hints and a docstring. Return the sorted list without modifying the original.",
            hints: [
                "Specify the programming language",
                "Define edge cases the code should handle",
                "Request type hints and documentation",
            ],
        },
    },
    {
        id: "tokens-and-tokenization",
        number: 3,
        title: "Tokens & Tokenization",
        subtitle: "How AI actually reads your text — it's not what you think",
        emoji: "🧩",
        color: "#06b6d4",
        estimatedMinutes: 10,
        lesson: {
            title: "Breaking Text into Machine-Readable Pieces",
            paragraphs: [
                "AI models don't read words. They read tokens — chunks of text that the model has learned are meaningful units. A token can be a word ('hello'), part of a word ('un' + 'believe' + 'able'), a single character, or even a space.",
                "Why does this matter? Because you PAY per token. GPT-4 charges $0.03 per 1K input tokens and $0.06 per 1K output tokens. A 500-token prompt asking for a 1000-token response costs: (500 × $0.03 + 1000 × $0.06) / 1000 = $0.075. That adds up quickly at scale.",
                "The tokenization algorithm used by most models is called Byte-Pair Encoding (BPE). It works by: (1) starting with individual characters, (2) finding the most frequent pair of adjacent characters, (3) merging that pair into a new token, (4) repeating thousands of times. Common words like 'the' become single tokens. Rare words get split into pieces.",
                "A practical rule of thumb: 1 token ≈ 4 characters in English, or about ¾ of a word. The sentence 'Hello, how are you?' is 6 tokens. But 'Pneumonoultramicroscopicsilicovolcanoconiosis' — that's 11 tokens for a single word! Efficiency varies wildly by language and vocabulary.",
            ],
            keyPoints: [
                "Tokens are the smallest units AI models process — not words",
                "You pay per token in API calls: both input AND output",
                "BPE (Byte-Pair Encoding) builds tokens from frequent character pairs",
                "Rule of thumb: 1 token ≈ 4 characters ≈ ¾ of a word",
            ],
        },
        exercise: {
            type: "token-challenge",
            question: "Which version uses FEWER tokens for the same task?",
            description: "Two prompts ask the same thing. Pick the one that's more token-efficient. Fewer tokens = lower cost = faster response.",
            options: [
                {
                    id: "a",
                    text: "Can you please help me write a Python function that takes a list as input and returns a new list that contains only the unique elements from the original list, removing any duplicates?",
                },
                {
                    id: "b",
                    text: "Write a Python function: input list → return deduplicated list. Preserve order.",
                },
            ],
            correctAnswer: "b",
            hints: [
                "Count the words (rough proxy for tokens)",
                "Filler phrases like 'Can you please help me' add tokens but zero information",
                "Concise prompts with the same specificity are always better",
            ],
        },
    },
    {
        id: "prompt-patterns",
        number: 4,
        title: "Prompt Patterns",
        subtitle: "Battle-tested templates the pros use daily",
        emoji: "🎯",
        color: "#10b981",
        estimatedMinutes: 8,
        lesson: {
            title: "Patterns That Unlock Better AI Responses",
            paragraphs: [
                "Just like software design patterns (Singleton, Observer, Factory), prompt engineering has its own set of proven patterns. Learn these and you'll handle 90% of real-world AI tasks effectively.",
                "CHAIN OF THOUGHT (CoT): Add 'Let's think step by step' or explicitly ask for reasoning before the answer. This forces the model to show its work, dramatically improving accuracy on math, logic, and complex analysis. Why it works: the model's 'thinking tokens' act as a scratchpad, reducing errors in the final answer.",
                "FEW-SHOT: Provide 2-5 examples of input → output before your actual input. The model learns the pattern from your examples and applies it. This is incredibly powerful for classification, formatting, and style matching. Pro tip: make your examples diverse to cover edge cases.",
                "ROLE PROMPTING: 'You are a senior data scientist with 15 years of experience in healthcare analytics.' This primes the model to use domain-specific vocabulary, reasoning patterns, and quality standards. More specific roles produce more expert-like outputs.",
            ],
            keyPoints: [
                "Chain of Thought (CoT): 'Think step by step' improves accuracy by 30-40%",
                "Few-Shot: 2-5 examples teach the model your exact desired format",
                "Role Prompting: specific personas unlock domain expertise",
                "Combine patterns: Role + CoT + Few-Shot is extremely powerful",
            ],
        },
        exercise: {
            type: "quiz",
            question: "A user needs GPT-4 to classify customer emails into 5 categories. Which pattern is MOST effective?",
            description: "Think about which pattern helps the model understand the exact output format and categories.",
            options: [
                { id: "a", text: "Chain of Thought — ask it to reason about each email" },
                { id: "b", text: "Few-Shot — provide 2-3 example emails with their correct category" },
                { id: "c", text: "Role Prompting — 'You are an email classifier'" },
                { id: "d", text: "Just list the 5 categories and say 'classify this'" },
            ],
            correctAnswer: "b",
            hints: [
                "Classification tasks need the model to understand your exact categories",
                "Examples are the clearest way to show 'this input → this category'",
            ],
        },
    },
    {
        id: "optimizing-cost-speed",
        number: 5,
        title: "Optimizing for Cost & Speed",
        subtitle: "Write prompts that are fast, cheap, and still excellent",
        emoji: "⚡",
        color: "#f59e0b",
        estimatedMinutes: 8,
        lesson: {
            title: "Practical Optimization for Production",
            paragraphs: [
                "In production, every token costs money and time. A 2000-token system prompt called 1 million times per day at GPT-4 rates costs over $60,000/month just on input tokens. Optimizing your prompts isn't optional — it's engineering.",
                "TECHNIQUE 1: Eliminate filler. 'Could you please kindly help me with' → just state the task. 'Please provide a comprehensive and detailed analysis' → 'Analyze'. Every unnecessary word is a wasted token.",
                "TECHNIQUE 2: Use structured formats. 'Input: {data}\\nTask: classify\\nOutput format: JSON {category, confidence}' is more efficient than a paragraph explaining the same thing. Structure is compressed information.",
                "TECHNIQUE 3: Choose the right model. GPT-3.5 is 20x cheaper than GPT-4 and handles 80% of tasks just as well. Use GPT-4 for reasoning-heavy tasks. Use 3.5 for formatting, extraction, and simple generation. This alone can cut costs by 10-15x.",
            ],
            keyPoints: [
                "Production costs scale with token count × call volume",
                "Remove filler words — they add tokens but zero information",
                "Structured prompts (key:value) are more token-efficient than prose",
                "Match model power to task complexity (GPT-3.5 for simple, GPT-4 for hard)",
            ],
        },
        exercise: {
            type: "fix-prompt",
            question: "Optimize this prompt to use fewer tokens while keeping the same output quality",
            description: "This prompt works but is wasteful. Rewrite it to be as concise as possible without losing any important instructions.",
            badPrompt: "Hello! I would really appreciate it if you could please help me out with something. I need you to carefully look at the following piece of text and then provide me with a brief summary of what the main points are. The summary should be in bullet point format and should not exceed 5 bullet points. Please make sure each bullet point is concise and captures a key idea from the text. Thank you so much for your help!",
            goodPrompt: "Summarize the text below in ≤5 bullet points. Each bullet: one key idea, concise.\n\nText: {input}",
            hints: [
                "Remove all pleasantries — the AI doesn't need 'thank you'",
                "Collapse repetitive instructions into single clear rules",
                "Use symbols (≤, →) instead of words where possible",
            ],
        },
    },
    {
        id: "system-prompts",
        number: 6,
        title: "System Prompts",
        subtitle: "The invisible layer that shapes every AI response",
        emoji: "🛡️",
        color: "#8b5cf6",
        estimatedMinutes: 8,
        lesson: {
            title: "System Prompts — The Control Layer",
            paragraphs: [
                "A system prompt is a special instruction that sits above the user's message in the API call. Unlike user prompts, system prompts are persistent — they apply to every turn of a conversation. Think of them as the AI's 'operating manual' for that session.",
                "System prompts define the AI's persona, boundaries, output format defaults, and behavioral rules. In ChatGPT, this is the hidden instruction that makes it helpful and safe. In production apps, this is where you configure the AI's entire personality and capabilities.",
                "Here's a production-grade system prompt structure:\n\n## IDENTITY\nYou are [role] for [company/product].\n\n## CAPABILITIES\n- What you CAN do\n- What you CANNOT do\n\n## RULES\n- Always do X\n- Never do Y\n\n## OUTPUT FORMAT\nDefault response format specification.",
                "Key insight: system prompts consume tokens on EVERY request. A 500-token system prompt called 100,000 times/day costs significant money. Keep them as concise as possible while being complete. Every word must earn its place.",
            ],
            keyPoints: [
                "System prompts persist across all turns in a conversation",
                "They define identity, capabilities, rules, and default formats",
                "System prompts consume tokens on every API call — keep them lean",
                "Structure: Identity → Capabilities → Rules → Output Format",
            ],
        },
        exercise: {
            type: "quiz",
            question: "Why should system prompts be kept as concise as possible?",
            description: "Think about what happens in production at scale.",
            options: [
                { id: "a", text: "Longer system prompts confuse the AI model" },
                { id: "b", text: "They consume tokens on every API call, multiplying cost at scale" },
                { id: "c", text: "System prompts have a strict character limit" },
                { id: "d", text: "Short prompts are always better than long ones" },
            ],
            correctAnswer: "b",
            hints: [
                "Think about cost implications when a system prompt runs millions of times",
                "What happens to your API bill when 500 tokens are prepended to every call?",
            ],
        },
    },
    {
        id: "multi-turn-conversations",
        number: 7,
        title: "Multi-turn Conversations",
        subtitle: "Managing context across back-and-forth exchanges",
        emoji: "💬",
        color: "#0ea5e9",
        estimatedMinutes: 10,
        lesson: {
            title: "Designing Multi-turn Interactions",
            paragraphs: [
                "Most real-world AI applications involve multiple exchanges, not one-shot prompts. Chat applications, customer support bots, coding assistants — these all require the model to maintain context across turns. Understanding how context windows work is critical.",
                "Every message in a conversation is sent to the model as a growing array: [system, user1, assistant1, user2, assistant2, ...]. The model sees ALL of this on every request. This means: more turns = more tokens = higher cost = slower responses. Eventually, you hit the context window limit (4K-128K tokens depending on model).",
                "Managing long conversations requires strategies:\n\nSLIDING WINDOW: Keep only the last N messages.\nSUMMARIZATION: Periodically summarize old messages into a compact context.\nRAG (Retrieval): Store conversation history in a database and retrieve only relevant parts.\nSELECTIVE CONTEXT: Only include messages relevant to the current question.",
                "Pro tip: Always include the system prompt and the user's latest message. For the middle context, use a summarization strategy. This gives you the best balance of context awareness and cost efficiency.",
            ],
            keyPoints: [
                "Every turn adds to the token count — old messages aren't free",
                "Context windows have hard limits (4K to 128K tokens)",
                "Use sliding window, summarization, or RAG for long conversations",
                "Always keep: system prompt + latest user message + relevant context",
            ],
        },
        exercise: {
            type: "quiz",
            question: "A chatbot conversation has grown to 50 messages. What is the BEST strategy to manage costs?",
            description: "The conversation is exceeding token limits. What should you do?",
            options: [
                { id: "a", text: "Send all 50 messages every time — the model needs full context" },
                { id: "b", text: "Keep only the last 3 messages and discard everything else" },
                { id: "c", text: "Summarize older messages into a compact context paragraph and keep recent messages in full" },
                { id: "d", text: "Start a new conversation from scratch" },
            ],
            correctAnswer: "c",
            hints: [
                "You need to balance context retention with cost efficiency",
                "Simply discarding old messages loses important context",
            ],
        },
    },
    {
        id: "prompt-chaining",
        number: 8,
        title: "Prompt Chaining",
        subtitle: "Breaking complex tasks into manageable steps",
        emoji: "🔗",
        color: "#14b8a6",
        estimatedMinutes: 8,
        lesson: {
            title: "Chaining Prompts for Complex Workflows",
            paragraphs: [
                "Not every task can be solved with a single prompt. Complex workflows — like 'analyze this PDF, extract key insights, generate a summary, then create action items' — should be broken into a chain of prompts, where each step's output feeds into the next step's input.",
                "Why chain instead of one big prompt? Three reasons: (1) Each step can use a different, optimized prompt. (2) You can use cheaper models for simple steps and expensive models for hard steps. (3) You can validate, filter, and transform intermediate outputs before passing them forward.",
                "A practical chaining pattern:\n\nStep 1: EXTRACT (GPT-3.5) — Pull raw data from input\nStep 2: ANALYZE (GPT-4) — Reason about the extracted data\nStep 3: FORMAT (GPT-3.5) — Structure the analysis into the final output\n\nThis costs ~70% less than running the entire task on GPT-4.",
                "Chaining pitfalls to avoid: (1) Don't chain when a single prompt works — the overhead isn't worth it. (2) Handle errors at each step — if step 2 fails, don't blindly pass garbage to step 3. (3) Keep total latency in mind — each chain link adds a round-trip to the API.",
            ],
            keyPoints: [
                "Chain prompts when a task has distinct phases (extract → analyze → format)",
                "Use cheaper models for simple steps, expensive ones for reasoning steps",
                "Validate output at each step before passing to the next",
                "Don't over-chain — single prompts are faster for simple tasks",
            ],
        },
        exercise: {
            type: "fix-prompt",
            question: "Split this monolithic prompt into a chain description",
            description: "This single prompt tries to do everything. Describe how you would break it into 2-3 chained steps.",
            badPrompt: "Read through all the customer reviews below, identify the top 5 complaints, analyze the severity of each complaint, calculate the estimated revenue impact, generate a detailed report with charts descriptions, and write an executive email summary to the VP of Product.",
            goodPrompt: "Step 1 (GPT-3.5): Extract and categorize all complaints from the reviews. Output: JSON list of {complaint, category, frequency}.\n\nStep 2 (GPT-4): Analyze the top 5 complaints by severity and estimate revenue impact. Output: analysis with severity scores.\n\nStep 3 (GPT-3.5): Format into an executive email summary for the VP of Product. Include: key findings, impact, recommended actions.",
            hints: [
                "Think about which parts need deep reasoning vs. simple formatting",
                "Consider which steps could use a cheaper model",
                "Each step should have a clear input and output format",
            ],
        },
    },
    {
        id: "evaluating-outputs",
        number: 9,
        title: "Evaluating AI Outputs",
        subtitle: "How to measure whether your prompts actually work",
        emoji: "📊",
        color: "#f59e0b",
        estimatedMinutes: 8,
        lesson: {
            title: "Measuring Prompt Quality Systematically",
            paragraphs: [
                "Writing a prompt is only half the job. The other half is evaluating whether the output is actually good. In production, you can't eyeball every response — you need systematic evaluation frameworks.",
                "Key evaluation dimensions:\n\nACCURACY — Is the information factually correct?\nRELEVANCE — Does it answer the actual question?\nCOMPLETENESS — Are all parts of the request addressed?\nFORMAT COMPLIANCE — Does it follow the specified output structure?\nTONE — Does it match the requested communication style?\nSAFETY — Does it avoid prohibited content?",
                "Automated evaluation techniques:\n\n1. LLM-as-Judge: Use a separate AI call to grade the output (e.g., 'Rate this response 1-10 for accuracy')\n2. String matching: Check if required keywords or structures are present\n3. JSON validation: Parse and validate structured outputs\n4. Human-in-the-loop: Sample random outputs for manual review\n5. A/B testing: Run two prompt versions and compare results statistically",
                "Golden rule: Always create a test dataset before optimizing your prompt. Without fixed test inputs, you can't tell if changes actually improve things or if you're just getting lucky.",
            ],
            keyPoints: [
                "Evaluate on: accuracy, relevance, completeness, format, tone, and safety",
                "Use LLM-as-Judge for scalable automated evaluation",
                "Create a fixed test dataset before optimizing prompts",
                "A/B test prompt changes — don't rely on single examples",
            ],
        },
        exercise: {
            type: "quiz",
            question: "You've improved a prompt and want to verify it's actually better. What's the MOST reliable approach?",
            description: "You changed the system prompt and want to make sure the new version is genuinely better.",
            options: [
                { id: "a", text: "Try it with one example and compare results visually" },
                { id: "b", text: "Run both versions on a fixed test dataset of 20+ examples and compare scores" },
                { id: "c", text: "Ask a colleague which output looks better" },
                { id: "d", text: "Check if the new prompt is shorter — shorter is always better" },
            ],
            correctAnswer: "b",
            hints: [
                "Single examples can be misleading — you need statistical significance",
                "Consistent test inputs let you isolate the effect of prompt changes",
            ],
        },
    },
    {
        id: "multimodal-prompting",
        number: 10,
        title: "Vision & Multimodal",
        subtitle: "Working with images, code, and structured data in prompts",
        emoji: "👁️",
        color: "#ec4899",
        estimatedMinutes: 8,
        lesson: {
            title: "Beyond Text — Multimodal Prompting",
            paragraphs: [
                "Modern AI models (GPT-4V, Gemini, Claude 3) can process images alongside text. This opens up entirely new categories of tasks: analyzing screenshots, reading documents, describing photos, extracting data from charts, and even understanding UI designs.",
                "When prompting with images, the same principles apply but with additions:\n\n1. ALWAYS describe what you want extracted from the image\n2. Be specific about what part of the image matters\n3. Provide context about what the image represents\n4. Specify the output format explicitly\n\nExample: 'This is a screenshot of our analytics dashboard. Extract the top 3 metrics shown and their values. Output as JSON.'",
                "Multimodal prompts also include working with structured data. When your prompt includes a CSV table, JSON blob, or code snippet, formatting matters enormously. Use markdown code blocks, clear delimiters, and explicit labels:\n\n```\n## DATA\n```csv\nname,sales,region\nAlice,50000,West\nBob,45000,East\n```\n\n## TASK\nAnalyze the sales data above...",
                "Cost considerations: image tokens are expensive. A single high-res image can consume 1000+ tokens. Always resize images to the minimum resolution needed. Use 'low detail' mode when you only need to identify general content rather than read fine text.",
            ],
            keyPoints: [
                "GPT-4V, Gemini, Claude 3 can process images alongside text",
                "Always describe what to extract and how to format the output",
                "Format embedded data clearly with code blocks and delimiters",
                "Image tokens are expensive — resize to minimum needed resolution",
            ],
        },
        exercise: {
            type: "quiz",
            question: "When including a CSV table in a prompt, what is the MOST effective way to format it?",
            description: "You need the AI to analyze tabular data embedded in your prompt.",
            options: [
                { id: "a", text: "Paste it as plain text without any formatting" },
                { id: "b", text: "Describe the data in natural language paragraphs" },
                { id: "c", text: "Use a markdown code block with clear column headers and a label (## DATA)" },
                { id: "d", text: "Convert it to a numbered list of values" },
            ],
            correctAnswer: "c",
            hints: [
                "Structure helps the model parse data correctly",
                "Clear delimiters prevent the model from confusing data with instructions",
            ],
        },
    },
];

/* ─── Exercise Grading ─── */

export function gradeQuiz(exercise: Exercise, answer: string): {
    correct: boolean;
    score: number;
    feedback: string;
} {
    const correct = answer === exercise.correctAnswer;
    return {
        correct,
        score: correct ? 100 : 0,
        feedback: correct
            ? "Correct! You've understood this concept well."
            : `Not quite. The correct answer highlights the most effective approach. Review the lesson's key points and try again.`,
    };
}

export function gradeFixPrompt(exercise: Exercise, userPrompt: string): {
    score: number;
    feedback: string;
    improvements: string[];
} {
    const checks = [
        { test: userPrompt.length < (exercise.badPrompt?.length || 999), label: "More concise than the original", weight: 15 },
        { test: /role|you are|act as/i.test(userPrompt), label: "Includes a role/persona", weight: 15 },
        { test: /format|json|bullet|list|markdown/i.test(userPrompt), label: "Specifies output format", weight: 15 },
        { test: /constraint|must|should not|limit|edge case|handle/i.test(userPrompt), label: "Defines constraints or edge cases", weight: 15 },
        { test: /specific|python|function|type hint|docstring/i.test(userPrompt), label: "Uses specific technical terms", weight: 15 },
        { test: userPrompt.split(/[.!?\n]/).filter(Boolean).length >= 2, label: "Well-structured (multiple clear instructions)", weight: 10 },
        { test: userPrompt.length > 30, label: "Substantive (not too short)", weight: 5 },
        { test: !/please|help me|could you|would you|kindly/i.test(userPrompt), label: "No filler phrases", weight: 10 },
    ];

    let score = 0;
    const improvements: string[] = [];

    for (const check of checks) {
        if (check.test) {
            score += check.weight;
        } else {
            improvements.push(check.label);
        }
    }

    score = Math.min(score, 100);

    let feedback: string;
    if (score >= 85) feedback = "Excellent! This is a professional-grade prompt.";
    else if (score >= 65) feedback = "Good work! A few improvements would make this even better.";
    else if (score >= 40) feedback = "Decent start, but needs more structure and specificity.";
    else feedback = "Keep practicing! Review the lesson and try adding more specific instructions.";

    return { score, feedback, improvements };
}

export function gradeTokenChallenge(exercise: Exercise, answer: string): {
    correct: boolean;
    score: number;
    feedback: string;
    tokenComparison: { a: number; b: number };
} {
    const optA = exercise.options?.[0]?.text || "";
    const optB = exercise.options?.[1]?.text || "";
    const tokensA = Math.ceil(optA.length / 4);
    const tokensB = Math.ceil(optB.length / 4);

    const correct = answer === exercise.correctAnswer;
    return {
        correct,
        score: correct ? 100 : 0,
        feedback: correct
            ? `Correct! Option B uses ~${tokensB} tokens vs ~${tokensA} tokens for Option A. That's ${Math.round(((tokensA - tokensB) / tokensA) * 100)}% fewer tokens — same task, lower cost.`
            : `Option B is more efficient at ~${tokensB} tokens vs ~${tokensA} tokens. Remember: concise prompts that keep the same specificity are always better.`,
        tokenComparison: { a: tokensA, b: tokensB },
    };
}
