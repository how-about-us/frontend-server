import type { Transition } from "framer-motion";

/** 칩 ↔ 필터 툴바 교차 페이드 */
const mapToolbarCrossfade = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
} satisfies Transition;

export const mapToolbarPanelMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: mapToolbarCrossfade,
} as const;

export const mapChipSpring = {
  type: "spring" as const,
  stiffness: 520,
  damping: 34,
};
