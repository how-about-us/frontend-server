"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

import { GoogleMapsProvider } from "@/components/googleMap";
import { StompProvider } from "@/contexts/StompContext";
import { createQueryClient } from "@/lib/query/queryClient";

/**
 * 전역 레이아웃용 Provider 순서 —
 * 변경 시 채팅/STOMP/Google Maps 초기화를 함께 확인합니다.
 *
 * 순서: React Query → STOMP → Google Maps(Context) → 앱 라우트
 */
export function AppRootProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

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
      <StompProvider>
        <GoogleMapsProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </GoogleMapsProvider>
      </StompProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
