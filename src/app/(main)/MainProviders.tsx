"use client";

import type { ReactNode } from "react";
import { GoogleMapsProvider } from "@/components/googleMap";
import { MainRoomRedirectGuard } from "@/components/layout/MainRoomRedirectGuard";
import { SectionWidthProvider } from "@/contexts/SectionWidthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { SelectedPlaceProvider } from "@/contexts/SelectedPlaceContext";
import { MapCenterProvider } from "@/contexts/MapCenterContext";

/**
 * (main) 라우트 그룹에서 공통으로 쓰는 클라이언트 Provider 묶음.
 * 순서가 바뀌면 일부 훅/컴포넌트가 동작하지 않을 수 있으니 변경 시 맵·채팅·선택 UI를 함께 확인하세요.
 */
export function MainProviders({ children }: { children: ReactNode }) {
  return (
    <GoogleMapsProvider>
      <SectionWidthProvider>
        <ChatProvider>
          <SelectedPlaceProvider>
            <MapCenterProvider>
              <MainRoomRedirectGuard />
              {children}
            </MapCenterProvider>
          </SelectedPlaceProvider>
        </ChatProvider>
      </SectionWidthProvider>
    </GoogleMapsProvider>
  );
}
