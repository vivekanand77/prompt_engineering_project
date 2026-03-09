/**
 * TypeScript types and interfaces for API requests and responses
 */

// ─── API Request Types ───────────────────────────────────────────────────────

export interface GenerateRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ScoreRequest {
  prompt: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface GenerateResponse {
  output: string;
  model: string;
  live: boolean;
  tokens: TokenUsage;
  timestamp: string;
}

export interface ScoreResponse {
  score: number;
  feedback: string;
  live: boolean;
}

export interface StatusResponse {
  providers: {
    openai: boolean;
    google: boolean;
    nvidia: boolean;
  };
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  providers: {
    openai: boolean;
    google: boolean;
    nvidia: boolean;
  };
  uptime: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  statusCode: number;
  details?: unknown;
}

// ─── AI Provider Response Types ──────────────────────────────────────────────

export interface AIProviderResponse {
  output: string;
  usage: TokenUsage;
}

export interface OpenAIProviderResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface GeminiProviderResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface QwenProviderResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ─── Validation Schemas ──────────────────────────────────────────────────────

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate GenerateRequest
 */
export function validateGenerateRequest(
  body: unknown
): ValidationResult<GenerateRequest> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be an object" };
  }

  const req = body as Partial<GenerateRequest>;

  if (!req.prompt || typeof req.prompt !== "string") {
    return { success: false, error: "Prompt must be a non-empty string" };
  }

  if (req.prompt.length === 0) {
    return { success: false, error: "Prompt cannot be empty" };
  }

  if (req.model && typeof req.model !== "string") {
    return { success: false, error: "Model must be a string" };
  }

  if (
    req.temperature !== undefined &&
    (typeof req.temperature !== "number" ||
      req.temperature < 0 ||
      req.temperature > 1)
  ) {
    return {
      success: false,
      error: "Temperature must be a number between 0 and 1",
    };
  }

  if (
    req.maxTokens !== undefined &&
    (typeof req.maxTokens !== "number" || req.maxTokens < 1)
  ) {
    return { success: false, error: "MaxTokens must be a positive number" };
  }

  return {
    success: true,
    data: {
      prompt: req.prompt,
      model: req.model,
      temperature: req.temperature,
      maxTokens: req.maxTokens,
    },
  };
}

/**
 * Validate ScoreRequest
 */
export function validateScoreRequest(
  body: unknown
): ValidationResult<ScoreRequest> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be an object" };
  }

  const req = body as Partial<ScoreRequest>;

  if (!req.prompt || typeof req.prompt !== "string") {
    return { success: false, error: "Prompt must be a non-empty string" };
  }

  if (req.prompt.length === 0) {
    return { success: false, error: "Prompt cannot be empty" };
  }

  return {
    success: true,
    data: {
      prompt: req.prompt,
    },
  };
}
