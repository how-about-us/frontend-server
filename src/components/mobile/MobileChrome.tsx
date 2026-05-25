"use client";

import type { ReactNode } from "react";

import { MobileViewProvider } from "@/contexts/MobileViewContext";

import { MobilePortraitShell } from "./MobilePortraitShell";

/** 앱 루트 — 모바일 감지·가로 회전 셸 */
export function MobileChrome({ children }: { children: ReactNode }) {
  return (
    <MobileViewProvider>
      <MobilePortraitShell>{children}</MobilePortraitShell>
    </MobileViewProvider>
  );
}
