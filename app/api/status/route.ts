import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/config";
import type { StatusResponse } from "@/lib/types";

export async function GET(): Promise<NextResponse<StatusResponse>> {
  const providers = getAvailableProviders();

  return NextResponse.json({
    providers,
  });
}
