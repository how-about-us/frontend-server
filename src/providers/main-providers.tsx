"use client";

import type { ReactNode } from "react";

import { SelectedPlaceProvider } from "@/contexts/SelectedPlaceContext";
import { SectionWidthProvider } from "@/contexts/SectionWidthContext";

/**
 * 메인 크롬(헤더·맵 패널·채팅) 안에서 공유되는 UI 상태.
 * 채팅 패널 열림·크롬은 `useChatUnreadStore`/`useChat` — 맵 카메라는 `useMapCenterStore`,
 * Google Maps APIProvider는 `@/providers/root-providers`에서 한 번만 감쌉니다.
 */
export function MainChromeProviders({ children }: { children: ReactNode }) {
  return (
    <SectionWidthProvider>
      <SelectedPlaceProvider>{children}</SelectedPlaceProvider>
    </SectionWidthProvider>
  );
}
