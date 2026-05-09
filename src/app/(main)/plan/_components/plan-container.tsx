"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { PLAN_CONTAINER_NARROW_MAX_INLINE_PX } from "@/lib/layout-tokens";
import {
  readPlanContainerContentInlineSize,
  readResizeObserverContentInlineSize,
} from "@/lib/plan/planContainerLayout";

const PlanContainerRefContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function PlanContainerRefProvider({
  containerRef,
  children,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <PlanContainerRefContext.Provider value={containerRef}>
      {children}
    </PlanContainerRefContext.Provider>
  );
}

/** `@container/plan` 이 붙은 루트 ref — 폭 측정용 */
export function usePlanContainerRef() {
  return useContext(PlanContainerRefContext);
}

/**
 * 플랜 루트 콘텐츠 박스 폭이 {@link PLAN_CONTAINER_NARROW_MAX_INLINE_PX} 미만인지.
 * 넓어질 때마다 `onBecomeWide` 호출(접힌 패널 상태 초기화 등).
 */
export function usePlanContainerNarrow(onBecomeWide?: () => void): boolean | null {
  const planContainerRef = usePlanContainerRef();
  const [narrow, setNarrow] = useState<boolean | null>(null);
  const onBecomeWideRef = useRef(onBecomeWide);

  useLayoutEffect(() => {
    onBecomeWideRef.current = onBecomeWide;
  }, [onBecomeWide]);

  useLayoutEffect(() => {
    const el = planContainerRef?.current;
    if (!el) return;

    const threshold = PLAN_CONTAINER_NARROW_MAX_INLINE_PX;

    const apply = (contentInlinePx: number) => {
      const isNarrow = contentInlinePx < threshold;
      setNarrow(isNarrow);
      if (!isNarrow) onBecomeWideRef.current?.();
    };

    apply(readPlanContainerContentInlineSize(el));

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      apply(readResizeObserverContentInlineSize(entry));
    });

    ro.observe(el, { box: "content-box" });
    return () => ro.disconnect();
  }, [planContainerRef]);

  return narrow;
}
