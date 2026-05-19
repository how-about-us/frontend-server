"use client";

import type { ReactNode } from "react";

import { useSessionStore } from "@/stores/session-store";

/**
 * `/home/*` — 루트 `reconcileClientSession`(`users/me`) 완료까지 자식 렌더 지연.
 */
export function HomeSessionSync({ children }: { children: ReactNode }) {
  const sessionReady = useSessionStore((s) => s.sessionReady);

  if (!sessionReady) {
    return null;
  }

  return <>{children}</>;
}
