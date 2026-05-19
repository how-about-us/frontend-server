"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { roomIdFromPlanPathname } from "@/lib/plan-room-path";
import {
  resolveCurrentRoomId,
  resolveRoomIdFromStoreAndUrl,
} from "@/lib/session-room-storage";
import {
  bootstrapCurrentRoomFromSessionStorage,
  useSessionStore,
} from "@/stores/session-store";

/**
 * 방 ID 해석 — hydration 안전.
 * 첫 페인트(SSR·클라이언트 hydration)는 URL·Zustand만 사용하고,
 * `useLayoutEffect` 이후 sessionStorage까지 반영합니다.
 */
export function useResolvedCurrentRoomId(urlRoomId?: string | null) {
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const ssrSafeRoomId = resolveRoomIdFromStoreAndUrl(
    currentRoomId,
    urlRoomId,
  );

  const [roomContextReady, setRoomContextReady] = useState(false);
  const [resolvedRoomId, setResolvedRoomId] = useState<string | null>(
    ssrSafeRoomId,
  );

  useLayoutEffect(() => {
    bootstrapCurrentRoomFromSessionStorage();
    const id = resolveCurrentRoomId(
      useSessionStore.getState().currentRoomId,
      urlRoomId,
    );
    setResolvedRoomId(id);
    if (id) {
      const stored = useSessionStore.getState().currentRoomId?.trim() ?? "";
      if (stored !== id) {
        useSessionStore.getState().setCurrentRoomId(id);
      }
    }
    setRoomContextReady(true);
  }, [urlRoomId, currentRoomId]);

  const effectiveRoomId = roomContextReady ? resolvedRoomId : ssrSafeRoomId;

  return { effectiveRoomId, roomContextReady };
}

/** pathname·sessionStorage·Zustand를 통합한 현재 방 ID */
export function useCurrentRoomId() {
  const pathname = usePathname();
  const planRoomIdFromUrl = roomIdFromPlanPathname(pathname);
  const { effectiveRoomId, roomContextReady } =
    useResolvedCurrentRoomId(planRoomIdFromUrl);

  return {
    roomId: effectiveRoomId,
    roomContextReady,
  };
}
