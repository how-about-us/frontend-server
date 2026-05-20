import type { Transition, Variants } from "framer-motion";

import type { ChatMessageType } from "@/types/chat";

const PANEL_SPRING: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 12 },
};

export const panelTransition: Transition = {
  layout: PANEL_SPRING,
  opacity: { duration: 0.2 },
  scale: { duration: 0.2 },
  y: { duration: 0.2 },
  borderRadius: PANEL_SPRING,
  boxShadow: { duration: 0.25 },
};

export function getPanelAnimate(isMinimized: boolean) {
  return {
    opacity: 1,
    scale: 1,
    y: 0,
    borderRadius: isMinimized ? 16 : 0,
    boxShadow: isMinimized
      ? "0 20px 40px -8px rgba(0,0,0,0.18)"
      : "0 0 0 0 rgba(0,0,0,0)",
  };
}

/** 채팅 말풍선 그룹 등장 — 패널보다 약하게 */
const chatMessageSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
};

export function getChatMessageMotion(
  type: ChatMessageType,
  options?: { placeIsMine?: boolean },
): {
  initial: Record<string, number>;
  transition: Transition;
} {
  if (type === "system") {
    return {
      initial: { opacity: 0, y: 8, scale: 0.97 },
      transition: chatMessageSpring,
    };
  }

  const fromRight =
    type === "mine" || (type === "place" && Boolean(options?.placeIsMine));

  if (fromRight) {
    return {
      initial: { opacity: 0, y: 12, x: 14 },
      transition: chatMessageSpring,
    };
  }

  return {
    initial: { opacity: 0, y: 12, x: -14 },
    transition: chatMessageSpring,
  };
}

export const chatTapSoft = { scale: 0.96 };
export const chatTapTransition = {
  type: "spring",
  stiffness: 500,
  damping: 28,
} as const;

export const chatAiLabelMotion = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -6 },
  transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] } as Transition,
};

/** 검색 페이지 «채팅 전송» 배너 상단 불빛 스윕 주기(s) */
export const chatPlaceShareBannerSweepDurationSec = 2.7 as const;

/** 같은 배너 배경 레드 글로우(밝아졌다 어두워졌다) 펄스 주기(s) */
export const chatPlaceShareBannerGlowDurationSec = 2.35 as const;
