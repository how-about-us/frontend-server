"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useMobileView } from "@/contexts/MobileViewContext";
import { useCurrentRoomId } from "@/hooks/use-room-id";
import { planPathForRoom } from "@/lib/join-room-workflow";
import { isMainRouteBlockedOnMobile } from "@/lib/mobile-view";

/** 모바일에서 (main) 비플랜 경로 → 플랜으로 보냄 */
export function useMainMobileRouteRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobileDevice } = useMobileView();
  const { roomId } = useCurrentRoomId();

  useEffect(() => {
    if (!isMobileDevice || !isMainRouteBlockedOnMobile(pathname)) return;
    const rid = typeof roomId === "string" ? roomId.trim() : "";
    router.replace(rid.length > 0 ? planPathForRoom(rid) : "/plan");
  }, [isMobileDevice, pathname, roomId, router]);
}

/** 모바일 기기에서 지정 경로로 replace */
export function useRedirectOnMobileDevice(href: string) {
  const router = useRouter();
  const { isMobileDevice } = useMobileView();

  useEffect(() => {
    if (isMobileDevice) router.replace(href);
  }, [isMobileDevice, href, router]);
}
