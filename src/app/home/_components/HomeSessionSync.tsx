"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useSessionStore } from "@/stores/session-store";

/**
 * `/home/*` — Zustand persist rehydrate 완료까지 자식 렌더를 지연합니다.
 * `users/me` 동기화는 루트 `AppRootProviders`의 `reconcileClientSession`에서 수행합니다.
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

  if (!persistResolved) {
    return null;
  }

  return <>{children}</>;
}
