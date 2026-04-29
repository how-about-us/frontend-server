"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { exchangeGoogleCode, getMe } from "@/lib/api/auth";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { useSessionStore } from "@/stores/session-store";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);
  const setUser = useSessionStore((s) => s.setUser);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const savedState = sessionStorage.getItem("oauth_state");
    sessionStorage.removeItem("oauth_state");

    if (!code || !returnedState || returnedState !== savedState) {
      router.replace("/login?error=OAuthCallback");
      return;
    }

    exchangeGoogleCode(code)
      .then(async (result) => {
        if (result.ok) {
          const maxAge = 60 * 60 * 24 * 365;
          const secure = location.protocol === "https:" ? "; Secure" : "";
          document.cookie = `${AUTH_SESSION_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;

          try {
            const me = await getMe();
            setUser(me);
          } catch {
            // 사용자 정보 조회 실패해도 로그인은 계속 진행
          }

          const pendingInviteCode = sessionStorage.getItem("pendingInviteCode");
          if (pendingInviteCode) {
            sessionStorage.removeItem("pendingInviteCode");
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
  }, [searchParams, router, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bubble-gray/80 via-white to-white px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bubble-gray/80 via-white to-white px-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
