/**
 * Centralized application configuration with validation
 * Ensures all required environment variables are present and valid
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const API_CONSTANTS = {
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 60_000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 20,
  RATE_LIMIT_SCORE_MAX_REQUESTS: 30,

  // Request limits
  MAX_PROMPT_LENGTH: 10_000,
  MAX_TOKENS_OUTPUT: 4096,
  MIN_TOKENS_OUTPUT: 64,
  DEFAULT_TOKENS_OUTPUT: 512,

  // API timeouts (milliseconds)
  API_TIMEOUT_MS: 30_000,
  API_RETRY_ATTEMPTS: 3,
  API_RETRY_DELAY_MS: 1000,

  // Model limits
  MAX_TEMPERATURE: 1.0,
  MIN_TEMPERATURE: 0.0,
  DEFAULT_TEMPERATURE: 0.7,

  // Response token estimation
  CHARS_PER_TOKEN: 4,
} as const;

export const SUPPORTED_MODELS = {
  OPENAI: "GPT-4",
  GEMINI: "Gemini Pro",
  QWEN: "NVIDIA Qwen",
  LOCAL: "Local LLM",
  CLAUDE: "Claude 3",
} as const;

// ─── Environment Variables ───────────────────────────────────────────────────

interface EnvironmentConfig {
  // AI Provider Keys (optional)
  OPENAI_API_KEY: string | undefined;
  GOOGLE_AI_API_KEY: string | undefined;
  NVIDIA_API_KEY: string | undefined;

  // Firebase Config (optional)
  NEXT_PUBLIC_FIREBASE_API_KEY: string | undefined;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string | undefined;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string | undefined;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string | undefined;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string | undefined;
  NEXT_PUBLIC_FIREBASE_APP_ID: string | undefined;

  // App Environment
  NODE_ENV: string;
  NEXT_PUBLIC_APP_URL: string | undefined;
}

function getEnvVar(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Validates and returns environment configuration
 * Only API keys are optional - app will work in simulation mode without them
 */
export function getConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    OPENAI_API_KEY: getEnvVar("OPENAI_API_KEY"),
    GOOGLE_AI_API_KEY: getEnvVar("GOOGLE_AI_API_KEY"),
    NVIDIA_API_KEY: getEnvVar("NVIDIA_API_KEY"),

    NEXT_PUBLIC_FIREBASE_API_KEY: getEnvVar("NEXT_PUBLIC_FIREBASE_API_KEY"),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: getEnvVar("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: getEnvVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: getEnvVar("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: getEnvVar("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    NEXT_PUBLIC_FIREBASE_APP_ID: getEnvVar("NEXT_PUBLIC_FIREBASE_APP_ID"),

    NODE_ENV: getEnvVar("NODE_ENV") || "development",
    NEXT_PUBLIC_APP_URL: getEnvVar("NEXT_PUBLIC_APP_URL"),
  };

  return config;
}

/**
 * Checks which AI providers are configured
 */
export function getAvailableProviders() {
  const config = getConfig();
  return {
    openai: Boolean(config.OPENAI_API_KEY),
    google: Boolean(config.GOOGLE_AI_API_KEY),
    nvidia: Boolean(config.NVIDIA_API_KEY),
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getConfig().NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === "development";
}
