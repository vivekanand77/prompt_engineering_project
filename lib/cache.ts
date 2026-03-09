/**
 * Response caching utility for API endpoints
 * Reduces load on external APIs and improves response times
 */

import { logger } from "./logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
}

class ResponseCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SIZE = 500;

  constructor(private options: CacheOptions = {}) {
    // Cleanup expired entries every minute
    if (typeof window === "undefined") {
      setInterval(() => this.cleanup(), 60_000);
    }
  }

  /**
   * Generate cache key from request parameters
   */
  private generateKey(endpoint: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join("&");
    return `${endpoint}:${sortedParams}`;
  }

  /**
   * Get cached response
   */
  get<T>(endpoint: string, params: Record<string, unknown> = {}): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug("Cache miss - expired", { endpoint, key });
      return null;
    }

    logger.debug("Cache hit", { endpoint, key });
    return entry.data;
  }

  /**
   * Set cached response
   */
  set<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    data: T,
    ttl?: number
  ): void {
    const key = this.generateKey(endpoint, params);
    const cacheTTL = ttl ?? this.options.ttl ?? this.DEFAULT_TTL;

    // Check max size
    if (this.cache.size >= (this.options.maxSize ?? this.MAX_SIZE)) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheTTL,
    });

    logger.debug("Cache set", { endpoint, key, ttl: cacheTTL });
  }

  /**
   * Invalidate cache for endpoint
   */
  invalidate(endpoint: string, params?: Record<string, unknown>): void {
    if (params) {
      const key = this.generateKey(endpoint, params);
      this.cache.delete(key);
      logger.debug("Cache invalidated", { endpoint, key });
    } else {
      // Invalidate all entries for this endpoint
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${endpoint}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.cache.delete(key));
      logger.debug("Cache invalidated - all", { endpoint, count: keysToDelete.length });
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    logger.info("Cache cleared");
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug("Cache cleanup", { expiredCount, remainingCount: this.cache.size });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize ?? this.MAX_SIZE,
      defaultTTL: this.options.ttl ?? this.DEFAULT_TTL,
    };
  }

  /**
   * Get or set pattern (fetch if not in cache)
   */
  async getOrSet<T>(
    endpoint: string,
    params: Record<string, unknown>,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<{ data: T; cached: boolean }> {
    const cached = this.get<T>(endpoint, params);

    if (cached !== null) {
      return { data: cached, cached: true };
    }

    const data = await fetcher();
    this.set(endpoint, params, data, ttl);
    return { data, cached: false };
  }
}

// Export singleton instance with default options
export const responseCache = new ResponseCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 500,
});

// Create specialized caches for different use cases
export const statusCache = new ResponseCache({
  ttl: 30 * 1000, // 30 seconds - status changes frequently
  maxSize: 10,
});

export const promptCache = new ResponseCache({
  ttl: 60 * 60 * 1000, // 1 hour - prompts don't change often
  maxSize: 1000,
});
