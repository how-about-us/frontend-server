"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

import { GoogleMapsProvider } from "@/components/google-maps-provider";
import { StompProvider } from "@/contexts/StompContext";
import { clearStalePersistedSessionIfNoAuthCookie } from "@/lib/auth";
import {
  ROOM_COVER_PERSIST_STORAGE_KEY,
  dehydrateRoomCoverOnly,
} from "@/lib/room-cover-query";
import { createQueryClient } from "@/lib/query-client";
import { useSessionStore } from "@/stores/session-store";

const ROOM_COVER_PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

/**
 * 전역 레이아웃용 Provider 순서 —
 * 변경 시 채팅/STOMP/Google Maps 초기화를 함께 확인합니다.
 *
 * 순서: React Query → STOMP → Google Maps(Context) → 앱 라우트
 */
export function AppRootProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  const persistOptions = useMemo(
    () =>
      ({
        persister: createSyncStoragePersister({
          storage: typeof window !== "undefined" ? window.localStorage : null,
          key: ROOM_COVER_PERSIST_STORAGE_KEY,
          throttleTime: 1000,
        }),
        maxAge: ROOM_COVER_PERSIST_MAX_AGE_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: dehydrateRoomCoverOnly,
        },
      }) as const,
    [],
  );

  /** `skipHydration` 세션 스토어 — 클라 마운트 후 localStorage 병합·쿠키 불일치 정리 (`users/me`는 `/home` 등에서 동기화) */
  useEffect(() => {
    void (async () => {
      await useSessionStore.persist?.rehydrate?.();
      clearStalePersistedSessionIfNoAuthCookie();
    })();
  }, []);

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
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <StompProvider>
        <GoogleMapsProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </GoogleMapsProvider>
      </StompProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
