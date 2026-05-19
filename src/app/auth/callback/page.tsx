"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { AuthFlowSpinner } from "@/components/auth/AuthFlowSpinner";
import { exchangeGoogleCode } from "@/lib/api/auth";
import { consumePendingInviteCode, fetchSessionUserWithRetry } from "@/lib/auth";
import { tearDownClientSession } from "@/lib/client-storage";
import {
  getGoogleOAuthRedirectUri,
  OAUTH_STATE_SESSION_KEY,
} from "@/lib/google-oauth";
import { useSessionStore } from "@/stores/session-store";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useSessionStore((s) => s.setUser);
  const setSessionReady = useSessionStore((s) => s.setSessionReady);

  // React Strict Mode (Next dev) 에서 useEffect 가 두 번 실행되면
  // sessionStorage 의 pendingInviteCode/oauth_state 가 첫 실행에서 비워져
  // 두 번째 실행이 home/login 으로 잘못 리다이렉트한다. 코드 교환도 1회만 시도.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const savedState = sessionStorage.getItem(OAUTH_STATE_SESSION_KEY);
    sessionStorage.removeItem(OAUTH_STATE_SESSION_KEY);

    // 인증 흐름의 어떤 결과든 pendingInviteCode 를 한 번에 소비해
    // 다음 진입(예: 재로그인)에서 홀더 값이 남아있지 않도록 한다.
    const pendingInviteCode = consumePendingInviteCode();

    if (!code || !returnedState || returnedState !== savedState) {
      router.replace("/login?error=OAuthCallback");
      return;
    }

    exchangeGoogleCode(code, getGoogleOAuthRedirectUri())
      .then(async (result) => {
        if (result.ok) {
          const me = await fetchSessionUserWithRetry();
          if (!me) {
            tearDownClientSession();
            router.replace("/login?error=OAuthCallback");
            return;
          }
          setUser(me);
          setSessionReady(true);

          if (pendingInviteCode) {
            router.replace(`/join/${pendingInviteCode}`);
          } else {
            router.replace("/home");
          }
        } else {
          router.replace("/login?error=OAuthCallback");
        }
      })
      .catch(() => {
        router.replace("/login?error=OAuthCallback");
      });
  }, [searchParams, router, setUser, setSessionReady]);

  return <AuthFlowSpinner />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<AuthFlowSpinner />}
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
