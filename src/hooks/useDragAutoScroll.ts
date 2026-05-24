"use client";

import { useEffect, useRef, type RefObject } from "react";

const MAIN_CONTENT_SCROLL_SELECTOR = "[data-main-content-scroll]";

export type UseDragAutoScrollOptions = {
  /** 드래그 중일 때만 자동 스크롤을 활성화합니다. */
  active: boolean;
  /** 스크롤 대상 — 생략 시 `data-main-content-scroll` 요소를 사용합니다. */
  scrollRootRef?: RefObject<HTMLElement | null>;
  /** 상·하단 감지 영역(px). */
  edgeZone?: number;
  /** 경계에 가장 가까울 때 프레임당 최대 스크롤(px). */
  maxSpeed?: number;
};

function resolveScrollRoot(
  scrollRootRef?: RefObject<HTMLElement | null>,
): HTMLElement | null {
  if (scrollRootRef?.current) return scrollRootRef.current;
  return document.querySelector<HTMLElement>(MAIN_CONTENT_SCROLL_SELECTOR);
}

function applyEdgeAutoScroll(
  scrollRoot: HTMLElement,
  clientY: number,
  edgeZone: number,
  maxSpeed: number,
): void {
  const rect = scrollRoot.getBoundingClientRect();
  const distFromTop = clientY - rect.top;
  const distFromBottom = rect.bottom - clientY;

  const { scrollTop, scrollHeight, clientHeight } = scrollRoot;
  const canScrollUp = scrollTop > 0;
  const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;

  if (distFromTop < edgeZone && canScrollUp) {
    const ratio = (edgeZone - distFromTop) / edgeZone;
    scrollRoot.scrollTop -= maxSpeed * ratio;
    return;
  }

  if (distFromBottom < edgeZone && canScrollDown) {
    const ratio = (edgeZone - distFromBottom) / edgeZone;
    scrollRoot.scrollTop += maxSpeed * ratio;
  }
}

/**
 * HTML5 D&D 중 스크롤 컨테이너 상·하단 근처에서 가변 속도로 자동 스크롤합니다.
 */
export function useDragAutoScroll({
  active,
  scrollRootRef,
  edgeZone = 56,
  maxSpeed = 14,
}: UseDragAutoScrollOptions): void {
  const pointerYRef = useRef(0);
  const scrollRootRefRef = useRef(scrollRootRef);

  useEffect(() => {
    scrollRootRefRef.current = scrollRootRef;
  }, [scrollRootRef]);

  useEffect(() => {
    if (!active) return;

    let rafId = 0;

    const onDragOver = (e: DragEvent) => {
      pointerYRef.current = e.clientY;
      e.preventDefault();
    };

    const tick = () => {
      const scrollRoot = resolveScrollRoot(scrollRootRefRef.current);
      if (scrollRoot) {
        applyEdgeAutoScroll(
          scrollRoot,
          pointerYRef.current,
          edgeZone,
          maxSpeed,
        );
      }
      rafId = requestAnimationFrame(tick);
    };

    document.addEventListener("dragover", onDragOver);
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("dragover", onDragOver);
      cancelAnimationFrame(rafId);
    };
  }, [active, edgeZone, maxSpeed]);
}
