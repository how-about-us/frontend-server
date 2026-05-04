"use client";

import { useEffect } from "react";

import { useChat } from "@/contexts/ChatContext";
import { useSectionWidth } from "@/contexts/SectionWidthContext";
import { width } from "@/lib/layout-tokens";

/**
 * 플랜 페이지 전용: 채팅이 최대화면 좌측 섹션 max-width를 s1,
 * 최소화·닫기 후에는 s2로 되돌린다.
 */
export function PlanChatSectionWidth() {
  const { chatState } = useChat();
  const { setMaxWidth } = useSectionWidth();

  useEffect(() => {
    setMaxWidth(chatState === "maximized" ? width.s1 : width.s2);
    return () => setMaxWidth("");
  }, [chatState, setMaxWidth]);

  return null;
}
