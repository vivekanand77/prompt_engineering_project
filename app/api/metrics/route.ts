import { NextResponse } from "next/server";
import { performanceMonitor } from "@/lib/performance";
import { responseCache } from "@/lib/cache";

/**
 * Performance metrics endpoint
 * Returns current performance statistics
 */
export async function GET() {
  const metrics = performanceMonitor.getSummary();
  const cacheStats = responseCache.getStats();

  return NextResponse.json({
    performance: metrics,
    cache: cacheStats,
    timestamp: new Date().toISOString(),
  });
}
