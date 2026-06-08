import { NextRequest, NextResponse } from "next/server";

import { forwardBackendSetCookies } from "@/lib/auth-cookies";
import { requiredEnv } from "@/lib/required-env";

const API_BASE = requiredEnv("API_BASE_URL");

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    code?: unknown;
    agreementsAccepted?: unknown;
  };

  const backendRes = await fetch(`${API_BASE}/auth/google/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: body.code,
      agreementsAccepted: body.agreementsAccepted,
    }),
  });

  const res = new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: { "Content-Type": "application/json" },
  });

  forwardBackendSetCookies(res, backendRes);

  return res;
}
