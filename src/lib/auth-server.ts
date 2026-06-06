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

/**
 * 백엔드 도달 불가(네트워크 오류 등)와 정상 응답을 구분하기 위한 래퍼.
 * 도달 실패 시 `null`을 반환하고, 예외를 호출부로 전파하지 않습니다.
 */
async function safeFetch(
  input: string,
  init: RequestInit,
): Promise<Response | null> {
  try {
    return await fetch(input, init);
  } catch {
    return null;
  }
}

async function fetchUsersMe(cookieHeader: string): Promise<Response | null> {
  return safeFetch(`${API_BASE}/users/me`, {
    method: "GET",
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
}

async function fetchBackendRefresh(
  cookieHeader: string,
): Promise<Response | null> {
  return safeFetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
}

function warnSessionFetchFailed(label: string): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[auth-server] ${label} unreachable — treating as unauthenticated`);
  }
}

/**
 * `users/me`로 세션 검증. access 만료(401 등)이고 refresh_token이 있으면
 * `POST /auth/refresh` 후 `users/me` 재시도.
 *
 * 백엔드 도달 불가(네트워크 오류)는 fail-closed(`ok: false`)로 처리합니다.
 * 예외를 던지지 않아 미들웨어 크래시·dev 자동 리로드를 막고,
 * fail-open 시 생기던 `/home`↔`/login` document 루프도 차단합니다.
 */
export async function verifySessionWithOptionalRefresh(
  cookieHeader: string | null,
): Promise<SessionVerifyResult> {
  const cookie = cookieHeader?.trim() ?? "";
  if (!cookie.length) {
    return { ok: false, setCookies: [] };
  }

  const meRes = await fetchUsersMe(cookie);
  if (meRes === null) {
    warnSessionFetchFailed("GET /users/me");
    return { ok: false, setCookies: [] };
  }
  if (meRes.ok) {
    return { ok: true, setCookies: [] };
  }

  if (!cookieHeaderHasRefreshToken(cookie)) {
    return { ok: false, setCookies: [] };
  }

  const refreshRes = await fetchBackendRefresh(cookie);
  if (refreshRes === null) {
    warnSessionFetchFailed("POST /auth/refresh");
    return { ok: false, setCookies: [] };
  }
  if (!refreshRes.ok) {
    return { ok: false, setCookies: [] };
  }

  const setCookies = getSetCookieHeaders(refreshRes);
  const retryCookie = mergeSetCookiesIntoCookieHeader(cookie, setCookies);
  const retryMe = await fetchUsersMe(retryCookie);
  if (retryMe === null) {
    warnSessionFetchFailed("GET /users/me (after refresh)");
    return { ok: false, setCookies: [] };
  }

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
