"use client";

import { useCallback, useEffect, useState, type RefCallback } from "react";

/** LeftSection DOM 실측 너비(px) — ChatPanel `style.width` 동기화용 */
export function useLeftSectionWidthMeasure(): {
  setLeftSectionRef: RefCallback<HTMLElement>;
  measuredLeftWidthPx: number;
} {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [measuredLeftWidthPx, setMeasuredLeftWidthPx] = useState(0);

  const setLeftSectionRef: RefCallback<HTMLElement> = useCallback((el) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const w = node.getBoundingClientRect().width;
      if (w > 0) setMeasuredLeftWidthPx(Math.round(w));
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);

  return { setLeftSectionRef, measuredLeftWidthPx };
}
