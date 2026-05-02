"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useEffectiveMainRoomId } from "@/hooks/useEffectiveMainRoomId";

/**
 * (main): URL 또는 세션에 현재 방 ID가 없으면 `/home`으로 보내고,
 * 리다이렉트까지 셸(HeaderBar·사이드·페이지·맵 등)은 그리지 않습니다.
 */
export function MainRoomGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const effective = useEffectiveMainRoomId();

  useLayoutEffect(() => {
    if (!effective) router.replace("/home");
  }, [effective, router]);

  if (!effective) return null;

  return <>{children}</>;
}
