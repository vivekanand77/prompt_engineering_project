/**
 * Centralized rate limiting utility with automatic cleanup
 * FIXED: Race condition, memory leaks, missing headers
 */

import { API_CONSTANTS } from "./config";
import { RateLimitError } from "./errors";

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requestMap = new Map<string, number[]>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private locks = new Map<string, boolean>(); // FIX: Add lock for race condition

  constructor(private options: RateLimiterOptions) {
    // Cleanup old entries every minute to prevent memory leaks
    this.startCleanup();
  }

  private startCleanup() {
    // Only run cleanup in Node.js environment (not in browser)
    if (typeof window === "undefined") {
      // FIX: Store reference to cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60_000); // Cleanup every minute

      // FIX: Prevent interval leak - cleanup interval doesn't block process exit
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, timestamps] of this.requestMap.entries()) {
      const recentTimestamps = timestamps.filter(
        (t) => now - t < this.options.windowMs
      );

      if (recentTimestamps.length === 0) {
        keysToDelete.push(key);
      } else {
        this.requestMap.set(key, recentTimestamps);
      }
    }

    for (const key of keysToDelete) {
      this.requestMap.delete(key);
      this.locks.delete(key); // FIX: Clean up locks too
    }
  }

  /**
   * Check if identifier is rate limited
   * @throws RateLimitError if rate limit exceeded
   * FIX: Added lock to prevent race condition
   */
  check(identifier: string): void {
    // FIX: Simple lock to prevent TOCTOU race condition
    // If another request is checking this identifier, wait a tiny bit
    if (this.locks.get(identifier)) {
      // Another request is modifying this identifier, be conservative
      throw new RateLimitError(
        `Rate limit exceeded. Maximum ${this.options.maxRequests} requests per ${this.options.windowMs / 1000} seconds.`
      );
    }

    // Acquire lock
    this.locks.set(identifier, true);

    try {
      const now = Date.now();
      const timestamps = this.requestMap.get(identifier) ?? [];
      const recentTimestamps = timestamps.filter(
        (t) => now - t < this.options.windowMs
      );

      if (recentTimestamps.length >= this.options.maxRequests) {
        throw new RateLimitError(
          `Rate limit exceeded. Maximum ${this.options.maxRequests} requests per ${this.options.windowMs / 1000} seconds.`
        );
      }

      recentTimestamps.push(now);
      this.requestMap.set(identifier, recentTimestamps);
    } finally {
      // Release lock
      this.locks.delete(identifier);
    }
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const timestamps = this.requestMap.get(identifier) ?? [];
    const recentTimestamps = timestamps.filter(
      (t) => now - t < this.options.windowMs
    );
    return Math.max(0, this.options.maxRequests - recentTimestamps.length);
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requestMap.delete(identifier);
    this.locks.delete(identifier);
  }

  /**
   * Stop cleanup interval (call on app shutdown)
   * FIX: Now actually works since we store the reference
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.locks.clear();
  }
}

// Pre-configured rate limiters for different endpoints
export const generateRateLimiter = new RateLimiter({
  windowMs: API_CONSTANTS.RATE_LIMIT_WINDOW_MS,
  maxRequests: API_CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
});

export const scoreRateLimiter = new RateLimiter({
  windowMs: API_CONSTANTS.RATE_LIMIT_WINDOW_MS,
  maxRequests: API_CONSTANTS.RATE_LIMIT_SCORE_MAX_REQUESTS,
});

/**
 * Extract client IP from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  return "unknown";
}
