import { NextRequest, NextResponse } from "next/server";

import { appendSetCookies, getSetCookieHeaders } from "@/lib/auth-cookies";
import { requiredEnv } from "@/lib/required-env";

const API_BASE = requiredEnv("API_BASE_URL");

function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.length) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    map.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return map;
}

function mergeSetCookiesIntoCookieHeader(
  cookieHeader: string,
  setCookies: readonly string[],
): string {
  const map = parseCookieHeader(cookieHeader);
  for (const sc of setCookies) {
    const first = sc.split(";")[0]?.trim();
    if (!first) continue;
    const eq = first.indexOf("=");
    if (eq <= 0) continue;
    map.set(first.slice(0, eq), first.slice(eq + 1));
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function cookieHeaderHasRefreshToken(cookieHeader: string): boolean {
  return parseCookieHeader(cookieHeader).has("refresh_token");
}

type SessionVerifyResult = {
  ok: boolean;
  /** refresh 성공 시 브라우저에 전달할 Set-Cookie */
  setCookies: string[];
};

async function fetchUsersMe(cookieHeader: string): Promise<Response> {
  return fetch(`${API_BASE}/users/me`, {
    method: "GET",
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
}

async function fetchBackendRefresh(cookieHeader: string): Promise<Response> {
  return fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
}

/**
 * `users/me`로 세션 검증. access 만료(401 등)이고 refresh_token이 있으면
 * `POST /auth/refresh` 후 `users/me` 재시도.
 */
export async function verifySessionWithOptionalRefresh(
  cookieHeader: string | null,
): Promise<SessionVerifyResult> {
  const cookie = cookieHeader?.trim() ?? "";
  if (!cookie.length) {
    return { ok: false, setCookies: [] };
  }

  const meRes = await fetchUsersMe(cookie);
  if (meRes.ok) {
    return { ok: true, setCookies: [] };
  }

  if (!cookieHeaderHasRefreshToken(cookie)) {
    return { ok: false, setCookies: [] };
  }

  const refreshRes = await fetchBackendRefresh(cookie);
  if (!refreshRes.ok) {
    return { ok: false, setCookies: [] };
  }

  const setCookies = getSetCookieHeaders(refreshRes);
  const retryCookie = mergeSetCookiesIntoCookieHeader(cookie, setCookies);
  const retryMe = await fetchUsersMe(retryCookie);

  return {
    ok: retryMe.ok,
    setCookies: retryMe.ok ? setCookies : [],
  };
}

/** `GET /api/auth/session` Route Handler 본문 */
export async function sessionCheckResponse(
  request: NextRequest,
): Promise<NextResponse> {
  const { ok, setCookies } = await verifySessionWithOptionalRefresh(
    request.headers.get("cookie"),
  );

  const baseHeaders = { "Cache-Control": "no-store" } as const;

  if (ok) {
    const res = NextResponse.json(
      { authenticated: true },
      { status: 200, headers: baseHeaders },
    );
    appendSetCookies(res, setCookies);
    return res;
  }

  return NextResponse.json(
    { authenticated: false },
    { status: 401, headers: baseHeaders },
  );
}
