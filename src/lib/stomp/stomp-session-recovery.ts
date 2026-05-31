import type { QueryClient } from "@tanstack/react-query";
import type { Client } from "@stomp/stompjs";

import { expireClientSessionAndRedirect } from "@/lib/auth-session-client";
import { fetchSessionUserRaw } from "@/lib/session-user";
import { setSessionUserCache } from "@/lib/session-user-cache";
import {
  isStompAutoRecoverySuspended,
  STOMP_CONNECTION_ISSUE_MESSAGE,
  useStompConnectionStore,
} from "@/stores/stomp-connection-store";

/** 백엔드 access 만료 시 WebSocket close code (분기·로깅 참고용) */
export const STOMP_ACCESS_TOKEN_EXPIRED_CLOSE_CODE = 4001;

export const SESSION_PROBE_MAX_ATTEMPTS = 10;
export const SESSION_PROBE_RETRY_DELAY_MS = 5000;

export type SessionProbeOutcome = "authenticated" | "unauthorized" | "transient";

export type SessionProbeResult = {
  outcome: SessionProbeOutcome;
};

export type HandleStompReconnectOptions = {
  client: Client;
  queryClient: QueryClient;
  isSuppressed: () => boolean;
  isActive: () => boolean;
};

let reconnectPromise: Promise<void> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `GET /api/auth/session` — 200 / 401 / transient(5xx·네트워크·기타 4xx) 분기.
 */
export async function probeClientSession(): Promise<SessionProbeResult> {
  if (typeof window === "undefined") {
    return { outcome: "transient" };
  }

  try {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    });

    if (res.status === 200) {
      return { outcome: "authenticated" };
    }
    if (res.status === 401) {
      return { outcome: "unauthorized" };
    }
    if (res.status >= 500) {
      return { outcome: "transient" };
    }
    return { outcome: "transient" };
  } catch {
    return { outcome: "transient" };
  }
}

async function probeWithRetries(): Promise<SessionProbeResult> {
  for (let attempt = 1; attempt <= SESSION_PROBE_MAX_ATTEMPTS; attempt++) {
    const result = await probeClientSession();
    if (result.outcome !== "transient") {
      return result;
    }
    if (attempt < SESSION_PROBE_MAX_ATTEMPTS) {
      await sleep(SESSION_PROBE_RETRY_DELAY_MS);
    }
  }
  return { outcome: "transient" };
}

async function syncSessionUserCache(queryClient: QueryClient): Promise<void> {
  try {
    const user = await fetchSessionUserRaw();
    if (user) {
      setSessionUserCache(queryClient, user);
    }
  } catch {
    // session 200이면 STOMP 재연결은 진행
  }
}

/** session 갱신 실패 — 클라이언트 세션 정리 및 로그인 이동 */
export function handleStompSessionExpired(queryClient: QueryClient): void {
  expireClientSessionAndRedirect({ queryClient });
}

async function runStompReconnect({
  client,
  queryClient,
  isSuppressed,
  isActive,
}: HandleStompReconnectOptions): Promise<void> {
  if (!isActive() || isSuppressed() || isStompAutoRecoverySuspended()) {
    return;
  }

  const probe = await probeWithRetries();

  if (!isActive() || isSuppressed()) {
    return;
  }

  if (probe.outcome === "unauthorized") {
    handleStompSessionExpired(queryClient);
    return;
  }

  if (probe.outcome === "transient") {
    useStompConnectionStore
      .getState()
      .setConnectionIssue(STOMP_CONNECTION_ISSUE_MESSAGE);
    return;
  }

  useStompConnectionStore.getState().clearConnectionIssue();
  await syncSessionUserCache(queryClient);

  if (!isActive() || isSuppressed()) {
    return;
  }

  if (client.active) {
    await client.deactivate();
  }

  if (!isActive() || isSuppressed()) {
    return;
  }

  client.activate();
}

/**
 * WebSocket close 후 session 검증 → deactivate/activate 재연결 또는 로그아웃·장애 UI.
 * 단일 in-flight promise로 동시 호출을 합칩니다.
 */
export function handleStompReconnect(
  options: HandleStompReconnectOptions,
): Promise<void> {
  if (reconnectPromise) {
    return reconnectPromise;
  }

  reconnectPromise = runStompReconnect(options).finally(() => {
    reconnectPromise = null;
  });

  return reconnectPromise;
}
