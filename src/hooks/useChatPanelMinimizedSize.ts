"use client";

import { useCallback, useEffect, useState } from "react";

import {
  CHAT_PANEL_MINIMIZED_DEFAULT,
  clampChatPanelMinimizedSize,
  readChatPanelMinimizedSize,
  writeChatPanelMinimizedSize,
  type ChatPanelMinimizedSize,
} from "@/lib/chat/chat-panel-minimized-size";

export function useChatPanelMinimizedSize() {
  const [size, setSizeState] = useState<ChatPanelMinimizedSize>(
    CHAT_PANEL_MINIMIZED_DEFAULT,
  );

  useEffect(() => {
    setSizeState(readChatPanelMinimizedSize());
  }, []);

  const clampSize = useCallback((width: number, height: number) => {
    if (typeof window === "undefined") {
      return clampChatPanelMinimizedSize(width, height);
    }
    return clampChatPanelMinimizedSize(width, height, window);
  }, []);

  const setSize = useCallback(
    (next: ChatPanelMinimizedSize) => {
      setSizeState(clampSize(next.width, next.height));
    },
    [clampSize],
  );

  const persistSize = useCallback((next: ChatPanelMinimizedSize) => {
    const clamped = clampSize(next.width, next.height);
    setSizeState(clamped);
    writeChatPanelMinimizedSize(clamped);
  }, [clampSize]);

  return { size, setSize, persistSize, clampSize };
}
