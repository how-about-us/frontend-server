"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useSessionStore } from "@/stores/session-store";

function hasTrimmedRoomId(id: unknown): boolean {
  return typeof id === "string" && id.trim().length > 0;
}

/** `/plan/abc` 형태(구 URL)는 스토어에 roomId가 없어도 마이그레이션 페이지를 한 프레임 렌더합니다. */
function isLegacyPlanRoomPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 2 && parts[0] === "plan" && parts[1].length > 0;
}

/**
 * 인증은 미들웨어(`AUTH_SESSION_COOKIE`)에서 처리합니다.
 * (main) 안에서는 선택된 방이 없으면 `/home`으로 보냅니다.
 */
export function MainRoomGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const [gateReady, setGateReady] = useState(() =>
    typeof window !== "undefined"
      ? useSessionStore.persist.hasHydrated()
      : false,
  );

  useEffect(() => {
    if (useSessionStore.persist.hasHydrated()) {
      setGateReady(true);
      return;
    }
    return useSessionStore.persist.onFinishHydration(() => {
      setGateReady(true);
    });
  }, []);

  const allowWithoutStoredRoom = isLegacyPlanRoomPath(pathname);

  useEffect(() => {
    if (!gateReady) return;
    if (allowWithoutStoredRoom) return;
    if (!hasTrimmedRoomId(currentRoomId)) {
      router.replace("/home");
    }
  }, [allowWithoutStoredRoom, currentRoomId, gateReady, router]);

  if (!gateReady) {
    return null;
  }

  if (!hasTrimmedRoomId(currentRoomId) && !allowWithoutStoredRoom) {
    return null;
  }

  return <>{children}</>;
}
