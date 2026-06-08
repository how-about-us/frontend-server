import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { fetchAndSeedScheduleDrivingRoutes } from "@/lib/plan/schedule-bulk-hydration";
import { schedulePlacesFingerprint } from "@/lib/plan/planTravelLocalStorage";
import type { PlanPlace } from "@/lib/plan/types";

/**
 * 페이지 진입·새로고침 시 일차별 DRIVING 경로를 `routes/batch`로 1회 시딩합니다.
 * 리오더·추가·삭제 등으로 장소 목록이 바뀌면 batch는 재호출하지 않고, 무효화된 구간만 개별 GET합니다.
 */
export function usePrefetchScheduleDrivingRoutes(
  roomId: string,
  scheduleId: number,
  places: readonly PlanPlace[],
  enabled: boolean,
): boolean {
  const queryClient = useQueryClient();
  const [batchDone, setBatchDone] = useState(false);
  const initialBatchCompletedKeysRef = useRef(new Set<string>());

  const scheduleKey = `${roomId.trim()}:${scheduleId}`;

  const fingerprint = useMemo(
    () => schedulePlacesFingerprint([...places]),
    [places],
  );

  useLayoutEffect(() => {
    if (!enabled || !roomId.trim() || places.length < 2 || !fingerprint.length) {
      setBatchDone(false);
      return;
    }

    if (initialBatchCompletedKeysRef.current.has(scheduleKey)) {
      setBatchDone(true);
      return;
    }

    let cancelled = false;
    setBatchDone(false);

    void fetchAndSeedScheduleDrivingRoutes(
      queryClient,
      roomId,
      scheduleId,
      places,
    ).finally(() => {
      if (!cancelled) {
        initialBatchCompletedKeysRef.current.add(scheduleKey);
        setBatchDone(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, fingerprint, places, queryClient, roomId, scheduleId, scheduleKey]);

  /** enabled 전환 직후 이전 true 잔존으로 GET이 먼저 나가지 않도록 — batch 완료 전엔 false */
  return !enabled || batchDone;
}
