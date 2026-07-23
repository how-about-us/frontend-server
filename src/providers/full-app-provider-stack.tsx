"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

import { AnalyticsRouteTracker } from "@/components/analytics/AnalyticsRouteTracker";
import { ConsentGatedAnalytics } from "@/components/analytics/ConsentGatedAnalytics";
import { GoogleMapsProvider } from "@/components/google-maps-provider";
import { MobileChrome } from "@/components/mobile/MobileChrome";
import { StompProvider } from "@/contexts/StompContext";
import { analyticsRuntime } from "@/lib/analytics/runtime";
import { reconcileClientSession } from "@/lib/auth";
import { beginClientSessionReconciliationTransition } from "@/lib/auth-session";
import { createQueryClient, registerQueryClient } from "@/lib/query-client";
import { useSessionStore } from "@/stores/session-store";

/**
 * 앱 경로 전용 Provider 순서 —
 * React Query → 세션 조정 → STOMP → Google Maps → 앱 크롬.
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

export function FullAppProviderStack({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    registerQueryClient(client);
    return client;
  });

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
            >
              <AnalyticsRouteTracker />
            </ConsentGatedAnalytics>
          ) : null}
          <Toaster position="bottom-right" richColors />
        </GoogleMapsProvider>
      </StompProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
