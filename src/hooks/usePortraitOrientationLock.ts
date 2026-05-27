"use client";

import { useEffect } from "react";

/** Screen Orientation API lock/unlock — not in default DOM lib typings */
type LockableScreenOrientation = ScreenOrientation & {
  lock?(orientation: "portrait"): Promise<void>;
  unlock?(): void;
};

/** 모바일 기기에서 세로 orientation lock 시도 (미지원 시 무시) */
export function usePortraitOrientationLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof screen === "undefined") return;

    const tryLock = async () => {
      const orientation = screen.orientation as
        | LockableScreenOrientation
        | undefined;
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
        const orientation = screen.orientation as
          | LockableScreenOrientation
          | undefined;
        orientation?.unlock?.();
      } catch {
        // ignore
      }
    };
  }, [enabled]);
}
