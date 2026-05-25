"use client";

import type { ReactNode } from "react";

import { useMobileView } from "@/contexts/MobileViewContext";
import { usePortraitOrientationLock } from "@/hooks/usePortraitOrientationLock";

/**
 * 모바일 가로 시 세로 UI를 90° 회전.
 * `screen.orientation.lock('portrait')`는 모바일 기기에서 별도 시도.
 */
export function MobilePortraitShell({ children }: { children: ReactNode }) {
  const { isMobileDevice, isMobileLandscape } = useMobileView();

  usePortraitOrientationLock(isMobileDevice);

  if (!isMobileDevice) return <>{children}</>;
  if (!isMobileLandscape) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-white"
      data-mobile-portrait-rotate
    >
      <div
        className="absolute left-1/2 top-1/2 flex overflow-hidden bg-white"
        style={{
          width: "100dvh",
          height: "100dvw",
          transform: "translate(-50%, -50%) rotate(90deg)",
        }}
      >
        <div className="h-full min-h-0 w-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
