"use client";

import type { CSSProperties, ReactNode, Ref } from "react";

export type PlanItineraryReorderRowProps = {
  rowRef?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  children: ReactNode;
};

/** 일정 장소 행 — D&D reorder·일차 간 insert translate 애니메이션 래퍼 */
export function PlanItineraryReorderRow({
  rowRef,
  style,
  children,
}: PlanItineraryReorderRowProps) {
  return (
    <div ref={rowRef} style={style}>
      {children}
    </div>
  );
}
