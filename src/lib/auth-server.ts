import { NextRequest, NextResponse } from "next/server";

import { requiredEnv } from "@/lib/required-env";

const API_BASE = requiredEnv("API_BASE_URL");

/** 백엔드 `GET /users/me`로 Cookie 헤더 기반 세션 검증 */
export async function verifySessionWithBackend(
  cookieHeader: string | null,
): Promise<boolean> {
  if (!cookieHeader?.trim()) return false;

  const backendRes = await fetch(`${API_BASE}/users/me`, {
    method: "GET",
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  return backendRes.ok;
}

/** `GET /api/auth/session` Route Handler 본문 */
export async function sessionCheckResponse(
  request: NextRequest,
): Promise<NextResponse> {
  const ok = await verifySessionWithBackend(request.headers.get("cookie"));

  if (ok) {
    return NextResponse.json(
      { authenticated: true },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { authenticated: false },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

/** `proxy.ts` — 동일 출처 session API로 HttpOnly 세션 여부 판별 */
export async function hasAuthenticatedSession(
  request: NextRequest,
): Promise<boolean> {
  const cookie = request.headers.get("cookie");
  if (!cookie?.trim()) return false;

  const url = new URL("/api/auth/session", request.url);
  const res = await fetch(url, {
    headers: { cookie },
    cache: "no-store",
  });

  return res.ok;
}
