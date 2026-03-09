import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/config";
import type { HealthCheckResponse } from "@/lib/types";

const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const providers = getAvailableProviders();
  const hasAnyProvider = providers.openai || providers.google || providers.nvidia;

  const health: HealthCheckResponse = {
    status: hasAnyProvider ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    providers,
    uptime: Date.now() - startTime,
  };

  const statusCode = health.status === "healthy" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
