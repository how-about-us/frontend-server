/**
 * `@container/plan` 과 동일한 축 — 컨테이너 쿼리는 콘텐츠 박스 인라인 크기 기준.
 * `usePlanContainerNarrow` 임계값은 {@link PLAN_CONTAINER_NARROW_MAX_INLINE_PX},
 * `PlanPlaceCard` 반응형 레이아웃은 {@link PLAN_PLACE_CARD_TW}.
 */
export function readPlanContainerContentInlineSize(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  return el.clientWidth - pl - pr;
}

export function readResizeObserverContentInlineSize(
  entry: ResizeObserverEntry,
): number {
  if (entry.contentBoxSize?.length) {
    return entry.contentBoxSize[0]!.inlineSize;
  }
  return entry.contentRect.width;
}
