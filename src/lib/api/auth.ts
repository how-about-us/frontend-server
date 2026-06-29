import {
  messageForGoogleLoginError,
  readNormalizedApiErrorCode,
} from "@/lib/api/errors";
import { tryParseJson } from "@/lib/api/http";

const FETCH_OPTS: RequestInit = {
  credentials: "include",
};

export type ExchangeGoogleCodeResult =
  | { ok: true; status: "AUTHENTICATED" }
  | {
      ok: true;
      status: "SIGNUP_REQUIRED";
      signupToken: string;
      expiresInSeconds: number;
    }
  | { ok: false; status: number; errorCode?: string; message?: string };

export async function exchangeGoogleCode(
  code: string,
  agreementsAccepted?: true,
): Promise<ExchangeGoogleCodeResult> {
  const requestBody = agreementsAccepted
    ? { code, agreementsAccepted: true }
    : { code };
  const res = await fetch("/api/auth/google", {
    ...FETCH_OPTS,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (res.ok) {
    const body = await tryParseJson(res);
    if (body === null) return { ok: true, status: "AUTHENTICATED" };

    if (body !== null && typeof body === "object") {
      const signup = body as Record<string, unknown>;
      if (
        signup.status === "SIGNUP_REQUIRED" &&
        typeof signup.signupToken === "string" &&
        signup.signupToken.length > 0 &&
        typeof signup.expiresInSeconds === "number" &&
        Number.isFinite(signup.expiresInSeconds) &&
        signup.expiresInSeconds > 0
      ) {
        return {
          ok: true,
          status: "SIGNUP_REQUIRED",
          signupToken: signup.signupToken,
          expiresInSeconds: signup.expiresInSeconds,
        };
      }
    }

    return {
      ok: false,
      status: res.status,
      message: "로그인 응답을 확인할 수 없습니다. 다시 시도해 주세요.",
    };
  }

  const body = await tryParseJson(res);
  const errorCode = readNormalizedApiErrorCode(body);
  const message = messageForGoogleLoginError(body);

  return {
    ok: false,
    status: res.status,
    errorCode,
    message,
  };
}

export type CompleteGoogleSignupResult =
  | { ok: true }
  | { ok: false; status: number; errorCode?: string; message: string };

export async function completeGoogleSignup(
  signupToken: string,
): Promise<CompleteGoogleSignupResult> {
  const res = await fetch("/api/auth/google/signup", {
    ...FETCH_OPTS,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signupToken, agreementsAccepted: true }),
  });

  if (res.ok) return { ok: true };

  const body = await tryParseJson(res);
  return {
    ok: false,
    status: res.status,
    errorCode: readNormalizedApiErrorCode(body),
    message: messageForGoogleLoginError(
      body,
      "가입 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    ),
  };
}

async function refreshToken(): Promise<
  { ok: true } | { ok: false; status: number }
> {
  const res = await fetch("/api/auth/refresh", {
    ...FETCH_OPTS,
    method: "POST",
  });

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}

let pendingRefresh: Promise<boolean> | null = null;

/** 브라우저: `POST /api/auth/refresh` — 동시 401에 대해 1회만 호출 */
export async function tryClientRefresh(): Promise<boolean> {
  if (!pendingRefresh) {
    pendingRefresh = refreshToken()
      .then((r) => r.ok)
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
}

export async function logout(): Promise<
  { ok: true } | { ok: false; status: number }
> {
  const res = await fetch("/api/auth/logout", {
    ...FETCH_OPTS,
    method: "POST",
  });

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}
