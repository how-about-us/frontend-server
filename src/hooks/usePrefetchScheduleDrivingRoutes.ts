import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { hydrateScheduleDrivingRoutes } from "@/lib/plan/schedule-bulk-hydration";
import type { PlanPlace } from "@/lib/plan/types";

/** 일차별 DRIVING 구간 경로를 batch API로 prefetch해 per-segment N+1을 줄입니다. */
export function usePrefetchScheduleDrivingRoutes(
  roomId: string,
  scheduleId: number,
  places: readonly PlanPlace[],
  enabled: boolean,
): void {
  const queryClient = useQueryClient();
  const lastFingerprintRef = useRef("");

  useEffect(() => {
    if (!enabled || !roomId.trim() || places.length < 2) return;

    const fingerprint = places
      .map((p) => p.itemId)
      .filter((id): id is number => typeof id === "number")
      .join(",");
    if (!fingerprint.length || fingerprint === lastFingerprintRef.current) {
      return;
    }
    lastFingerprintRef.current = fingerprint;

    void hydrateScheduleDrivingRoutes(
      queryClient,
      roomId,
      scheduleId,
      places,
    );
  }, [enabled, places, queryClient, roomId, scheduleId]);
}
