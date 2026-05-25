"use client";

import { useMobileView } from "@/contexts/MobileViewContext";
import { planCopyForDevice } from "@/lib/mobile-view";

/** 플랜 페이지 — 모바일 조회 전용 UI 분기 */
export function usePlanMobileReadOnly() {
  const { isMobileDevice } = useMobileView();
  return {
    isReadOnly: isMobileDevice,
    copy: planCopyForDevice(isMobileDevice),
  };
}
