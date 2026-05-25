"use client";

import { useEffect } from "react";

/** 모바일 기기에서 세로 orientation lock 시도 (미지원 시 무시) */
export function usePortraitOrientationLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof screen === "undefined") return;

    const tryLock = async () => {
      const orientation = screen.orientation;
      if (!orientation?.lock) return;
      try {
        await orientation.lock("portrait");
      } catch {
        // iOS Safari 등 — 회전 UI 폴백
      }
    };

    void tryLock();

    return () => {
      try {
        screen.orientation?.unlock?.();
      } catch {
        // ignore
      }
    };
  }, [enabled]);
}
