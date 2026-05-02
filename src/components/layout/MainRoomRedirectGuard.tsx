"use client";

import { useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useSessionStore } from "@/stores/session-store";

/** `/plan/:roomId` 한 단계 세그먼트만 허용 (pathname 기준, 쿼리·해시 없음) */
const PLAN_ROOM_PATTERN = /^\/plan\/([^/]+)$/;

function roomIdFromPathname(pathname: string): string | null {
  const m = PLAN_ROOM_PATTERN.exec(pathname);
  return m?.[1] ?? null;
}

/**
 * (main) 하위에서는 URL(`/plan/[roomId]`) 또는 세션의 `currentRoomId` 중 하나로
 * 현재 방을 식별할 수 있어야 합니다. 둘 다 없으면 `/home`으로 보냅니다.
 *
 * 검사 시점: 마운트(새로고침 포함), 라우트(pathname) 변경, `currentRoomId` 변경.
 */
export function MainRoomRedirectGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const storedRoomId = useSessionStore((s) => s.currentRoomId);

  useLayoutEffect(() => {
    const fromPlanPath = roomIdFromPathname(pathname);
    const effective = fromPlanPath ?? storedRoomId;
    if (!effective) router.replace("/home");
  }, [pathname, router, storedRoomId]);

  return null;
}
