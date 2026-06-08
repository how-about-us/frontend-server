import { NextResponse } from "next/server";

import { requiredEnv } from "@/lib/required-env";

const API_BASE = requiredEnv("API_BASE_URL");

export async function GET() {
  const backendRes = await fetch(`${API_BASE}/api/agreements/current`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
