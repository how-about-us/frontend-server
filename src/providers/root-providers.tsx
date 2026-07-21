"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

import { ConsentGatedAnalytics } from "@/components/analytics/ConsentGatedAnalytics";
import { MobileChrome } from "@/components/mobile/MobileChrome";
import { GoogleMapsProvider } from "@/components/google-maps-provider";
import { StompProvider } from "@/contexts/StompContext";
import { reconcileClientSession } from "@/lib/auth";
import { analyticsRuntime } from "@/lib/analytics/runtime";
import { beginClientSessionReconciliationTransition } from "@/lib/auth-session";
import { createQueryClient, registerQueryClient } from "@/lib/query-client";
import { useSessionStore } from "@/stores/session-store";

/**
 * 전역 레이아웃용 Provider 순서 —
 * 변경 시 채팅/STOMP/Google Maps 초기화를 함께 확인합니다.
 *
 * 순서: React Query → STOMP → Google Maps(Context) → 앱 라우트
 */
function SessionReconciler() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const previousPathname = useRef<string | null>(null);

  useLayoutEffect(() => {
    previousPathname.current =
      beginClientSessionReconciliationTransition({
        previousPathname: previousPathname.current,
        pathname,
        markSessionPending: () =>
          useSessionStore.getState().setSessionReady(false),
        reconcile: () => {
          void reconcileClientSession(queryClient);
        },
      });
  }, [pathname, queryClient]);

  return null;
}

export function AppRootProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    registerQueryClient(client);
    return client;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      document.documentElement.classList.toggle("dark", media.matches);
    };

    apply();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }

    media.addListener(apply);
    return () => media.removeListener(apply);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionReconciler />
      <StompProvider>
        <GoogleMapsProvider>
          <MobileChrome>{children}</MobileChrome>
          {analyticsRuntime.enabled && analyticsRuntime.measurementId ? (
            <ConsentGatedAnalytics
              debugMode={analyticsRuntime.debugMode}
              gaId={analyticsRuntime.measurementId}
            />
          ) : null}
          <Toaster position="bottom-right" richColors />
        </GoogleMapsProvider>
      </StompProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
