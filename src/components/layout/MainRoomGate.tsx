"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useSessionStore } from "@/stores/session-store";

/** `/plan/:roomId` 한 단계 세그먼트만 허용 (pathname 기준) */
const PLAN_ROOM_PATTERN = /^\/plan\/([^/]+)$/;

export function roomIdFromMainPathname(pathname: string): string | null {
  const m = PLAN_ROOM_PATTERN.exec(pathname);
  return m?.[1] ?? null;
}

export function resolveEffectiveMainRoomId(
  pathname: string,
  storedRoomId: string | null,
): string | null {
  const fromPlan = roomIdFromMainPathname(pathname);
  return fromPlan ?? storedRoomId;
}

/**
 * (main): URL 또는 세션에 현재 방 ID가 없으면 `/home`으로 보내고,
 * 리다이렉트까지 셸(HeaderBar·사이드·페이지·맵 등)은 그리지 않습니다.
 */
export function MainRoomGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const storedRoomId = useSessionStore((s) => s.currentRoomId);

  const effective = resolveEffectiveMainRoomId(pathname, storedRoomId);

  useLayoutEffect(() => {
    if (!effective) router.replace("/home");
  }, [effective, router]);

  if (!effective) return null;

  return <>{children}</>;
}
