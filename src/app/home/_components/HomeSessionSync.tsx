"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useSessionStore } from "@/stores/session-store";

/**
 * `/home/*` — persist rehydrate + 루트 `reconcileClientSession`(`users/me`) 완료까지 자식 렌더 지연.
 */
export function HomeSessionSync({ children }: { children: ReactNode }) {
  const sessionReady = useSessionStore((s) => s.sessionReady);
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

  if (!persistResolved || !sessionReady) {
    return null;
  }

  return <>{children}</>;
}
