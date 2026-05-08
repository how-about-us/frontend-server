"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { validateRoomAccess } from "@/lib/rooms/validateRoomAccess";
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
 *
 * 세션 병합은 루트 `AppRootProviders`의 `rehydrate()` 이후에만 판단합니다.
 */
export function MainRoomGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentRoomId = useSessionStore((s) => s.currentRoomId);

  const [persistResolved, setPersistResolved] = useState(false);

  useEffect(() => {
    const api = useSessionStore.persist;
    if (!api?.onFinishHydration) {
      setPersistResolved(true);
      return;
    }
    if (api.hasHydrated()) {
      setPersistResolved(true);
      return;
    }
    return api.onFinishHydration(() => {
      setPersistResolved(true);
    });
  }, []);

  const allowWithoutStoredRoom = isLegacyPlanRoomPath(pathname);

  useEffect(() => {
    if (!persistResolved) return;
    if (allowWithoutStoredRoom) return;
    const rid = useSessionStore.getState().currentRoomId?.trim() ?? "";
    if (!rid.length) return;

    let cancelled = false;
    void (async () => {
      const verdict = await validateRoomAccess(rid);
      if (cancelled || verdict !== "forbidden") return;
      const session = useSessionStore.getState();
      session.clearCurrentRoomId();
      session.clearCurrentRoomInviteCode();
      session.clearCurrentRoomMeta();
      router.replace("/home");
    })();
    return () => {
      cancelled = true;
    };
  }, [persistResolved, allowWithoutStoredRoom, router, currentRoomId]);

  useEffect(() => {
    if (!persistResolved) return;
    if (allowWithoutStoredRoom) return;
    const rid = useSessionStore.getState().currentRoomId;
    if (!hasTrimmedRoomId(rid)) {
      router.replace("/home");
    }
  }, [
    persistResolved,
    allowWithoutStoredRoom,
    router,
    pathname,
    currentRoomId,
  ]);

  if (!persistResolved) {
    return null;
  }

  if (
    !hasTrimmedRoomId(useSessionStore.getState().currentRoomId) &&
    !allowWithoutStoredRoom
  ) {
    return null;
  }

  return <>{children}</>;
}
