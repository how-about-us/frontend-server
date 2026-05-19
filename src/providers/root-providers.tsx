"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

import { GoogleMapsProvider } from "@/components/google-maps-provider";
import { StompProvider } from "@/contexts/StompContext";
import { reconcileClientSession } from "@/lib/auth";
import {
  ROOM_COVER_PERSIST_STORAGE_KEY,
  dehydrateRoomCoverOnly,
  getRoomCoverPersistStorage,
} from "@/lib/room-cover-query";
import { createQueryClient } from "@/lib/query-client";

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
          storage: getRoomCoverPersistStorage(),
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

  /** `users/me`로 메모리 `user` 정합 (방 ID는 위 동기 부팅에서 이미 시드) */
  useEffect(() => {
    void reconcileClientSession();
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
