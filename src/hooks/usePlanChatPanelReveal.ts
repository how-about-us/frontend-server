"use client";

import { useEffect, useState } from "react";

import type { ChatState } from "@/stores/chat-panel-store";
import {
  PLAN_CHAT_REVEAL_FALLBACK_MS,
  shouldDeferChatPanelReveal,
} from "@/lib/layout/mainChromeLayoutWidth";

/**
 * 플랜: LeftSection 폭 축소 후 maximized ChatPanel 마운트·등장 애니메이션.
 */
export function usePlanChatPanelReveal({
  pathname,
  chatState,
  isMobile,
  targetMaxWidthPx,
  measuredLeftWidthPx,
}: {
  pathname: string;
  chatState: ChatState;
  isMobile: boolean;
  targetMaxWidthPx: number | null;
  measuredLeftWidthPx: number;
}): boolean {
  const deferReveal = shouldDeferChatPanelReveal({
    pathname,
    chatState,
    isMobile,
    targetMaxWidthPx,
    measuredLeftWidthPx,
  });

  const [revealForced, setRevealForced] = useState(false);

  useEffect(() => {
    if (chatState !== "maximized") {
      setRevealForced(false);
      return;
    }
    if (!deferReveal) {
      setRevealForced(false);
      return;
    }
    const id = window.setTimeout(
      () => setRevealForced(true),
      PLAN_CHAT_REVEAL_FALLBACK_MS,
    );
    return () => window.clearTimeout(id);
  }, [chatState, deferReveal]);

  if (chatState !== "maximized") return true;
  if (!deferReveal) return true;
  return revealForced;
}
