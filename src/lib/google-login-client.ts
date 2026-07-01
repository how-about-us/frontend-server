import type { QueryClient } from "@tanstack/react-query";

import { AnalyticsEvents, trackAnalyticsEvent } from "@/lib/analytics/track";
import {
  consumePendingInviteCode,
  fetchSessionUserWithRetry,
} from "@/lib/auth";
import { tearDownClientSession } from "@/lib/client-storage";
import { clearGoogleAgreementFlowSession } from "@/lib/google-oauth";
import { setSessionUserCache } from "@/lib/session-user-cache";
import { useSessionStore } from "@/stores/session-store";

/** 쿠키 발급 후 클라이언트 세션을 동기화하고 최종 이동 경로를 반환합니다. */
export async function finishGoogleLogin(
  queryClient: QueryClient,
): Promise<string | null> {
  const me = await fetchSessionUserWithRetry();
  if (!me) {
    tearDownClientSession({ queryClient });
    useSessionStore.getState().setSessionReady(true);
    return null;
  }

  setSessionUserCache(queryClient, me);
  useSessionStore.getState().setSessionReady(true);
  clearGoogleAgreementFlowSession();
  trackAnalyticsEvent(AnalyticsEvents.login, { method: "google" });

  const pendingInviteCode = consumePendingInviteCode();
  return pendingInviteCode ? `/join/${pendingInviteCode}` : "/home";
}
