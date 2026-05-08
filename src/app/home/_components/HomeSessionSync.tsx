"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { syncSessionUserFromServer } from "@/lib/auth/session-sync";
import { useSessionStore } from "@/stores/session-store";

/**
 * `/home/*` 진입 시 persist 병합 후 서버 `users/me`와 `user`를 한 번 맞춥니다.
 * (루트에서는 rehydrate·쿠키 불일치 정리만 수행)
 */
export function HomeSessionSync({ children }: { children: ReactNode }) {
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

  useEffect(() => {
    if (!persistResolved) return;
    void syncSessionUserFromServer();
  }, [persistResolved]);

  return <>{children}</>;
}
