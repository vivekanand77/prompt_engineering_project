/**
 * Performance monitoring and metrics collection
 */

import { logger } from "./logger";

interface PerformanceMetrics {
  duration: number;
  endpoint: string;
  method: string;
  statusCode: number;
  timestamp: number;
  cached?: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow requests (> 3 seconds)
    if (metric.duration > 3000) {
      logger.warn("Slow request detected", {
        endpoint: metric.endpoint,
        duration: metric.duration,
        method: metric.method,
      });
    }
  }

  /**
   * Get average response time for an endpoint
   */
  getAverageResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / relevantMetrics.length);
  }

  /**
   * Get p95 response time
   */
  getP95ResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const sorted = relevantMetrics
      .map((m) => m.duration)
      .sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    return sorted[p95Index] || 0;
  }

  /**
   * Get error rate (percentage)
   */
  getErrorRate(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const errorCount = relevantMetrics.filter(
      (m) => m.statusCode >= 500
    ).length;
    return Math.round((errorCount / relevantMetrics.length) * 100 * 100) / 100;
  }

  /**
   * Get cache hit rate (percentage)
   */
  getCacheHitRate(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const cacheHits = relevantMetrics.filter((m) => m.cached).length;
    return Math.round((cacheHits / relevantMetrics.length) * 100 * 100) / 100;
  }

  /**
   * Get all metrics summary
   */
  getSummary() {
    return {
      totalRequests: this.metrics.length,
      averageResponseTime: this.getAverageResponseTime(),
      p95ResponseTime: this.getP95ResponseTime(),
      errorRate: this.getErrorRate(),
      cacheHitRate: this.getCacheHitRate(),
      byEndpoint: [
        "/api/generate",
        "/api/score",
        "/api/status",
        "/api/health",
      ].map((endpoint) => ({
        endpoint,
        averageResponseTime: this.getAverageResponseTime(endpoint),
        p95ResponseTime: this.getP95ResponseTime(endpoint),
        errorRate: this.getErrorRate(endpoint),
        cacheHitRate: this.getCacheHitRate(endpoint),
      })),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware helper to track performance
 */
export function withPerformanceTracking<T>(
  endpoint: string,
  method: string,
  handler: () => Promise<T>,
  statusCodeGetter: (result: T) => number
): Promise<T> {
  const startTime = Date.now();

  return handler()
    .then((result) => {
      const duration = Date.now() - startTime;
      performanceMonitor.record({
        duration,
        endpoint,
        method,
        statusCode: statusCodeGetter(result),
        timestamp: Date.now(),
      });
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      performanceMonitor.record({
        duration,
        endpoint,
        method,
        statusCode: error.statusCode || 500,
        timestamp: Date.now(),
      });
      throw error;
    });
}
