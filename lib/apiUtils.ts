/**
 * API utility with retry logic, timeout handling, and error management
 */

import { API_CONSTANTS } from "./config";
import { APIError, parseErrorMessage } from "./errors";
import { logger } from "./logger";

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create AbortController with timeout
 */
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = createTimeoutController(timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new APIError(
        `Request timeout after ${timeoutMs}ms`,
        url,
        408
      );
    }
    throw error;
  }
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxAttempts = API_CONSTANTS.API_RETRY_ATTEMPTS,
    delayMs = API_CONSTANTS.API_RETRY_DELAY_MS,
    timeoutMs = API_CONSTANTS.API_TIMEOUT_MS,
    onRetry,
  } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry on 5xx errors or 429 (rate limit)
      if (response.status >= 500 || response.status === 429) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          url,
          response.status
        );
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const backoffDelay = delayMs * Math.pow(2, attempt - 1);
        logger.warn(`API call failed, retrying in ${backoffDelay}ms`, {
          attempt,
          maxAttempts,
          url,
          error: parseErrorMessage(error),
        });

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        await sleep(backoffDelay);
      }
    }
  }

  logger.error("API call failed after all retry attempts", lastError, {
    url,
    maxAttempts,
  });

  throw lastError || new APIError("Request failed", url);
}

/**
 * Safe JSON parsing with fallback
 */
export function safeJSONParse<T = unknown>(
  text: string,
  fallback: T
): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    logger.warn("Failed to parse JSON", { error: parseErrorMessage(error), text: text.slice(0, 100) });
    return fallback;
  }
}

/**
 * Extract JSON from text that may contain markdown code blocks or extra text
 * More robust than regex-based parsing
 */
export function extractJSON<T = unknown>(text: string): T | null {
  try {
    // First, try direct parsing
    return JSON.parse(text) as T;
  } catch {
    // Try to find JSON in markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]) as T;
      } catch {
        // Continue to next method
      }
    }

    // Try to find JSON object in text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        // Continue to next method
      }
    }

    // Try to find JSON array in text
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as T;
      } catch {
        // All parsing methods failed
      }
    }

    logger.warn("Could not extract JSON from text", { textPreview: text.slice(0, 200) });
    return null;
  }
}
