import {
  messageForGoogleLoginError,
  readNormalizedApiErrorCode,
} from "@/lib/api/errors";
import { tryParseJson } from "@/lib/api/http";

const FETCH_OPTS: RequestInit = {
  credentials: "include",
};

export type ExchangeGoogleCodeResult =
  | { ok: true }
  | { ok: false; status: number; errorCode?: string; message?: string };

export async function exchangeGoogleCode(
  code: string,
  agreementsAccepted: boolean,
): Promise<ExchangeGoogleCodeResult> {
  const res = await fetch("/api/auth/google", {
    ...FETCH_OPTS,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, agreementsAccepted }),
  });

  if (res.ok) return { ok: true };

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
