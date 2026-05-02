"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

import { createQueryClient } from "@/lib/query/queryClient";
import { StompProvider } from "@/contexts/StompContext";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    // Tailwind/shadcn은 `.dark` 클래스 기반으로 동작합니다.
    // 초기 렌더 깜빡임을 최소화하기 위해 mount 시점에 동기화합니다.
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      document.documentElement.classList.toggle("dark", media.matches);
    };

    apply();

    // Safari/구형 브라우저 호환을 위해 분기 처리합니다.
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
        {children}
        <Toaster position="bottom-right" richColors />
      </StompProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
