export const width = {
  s1: "400px",
  s2: "720px",
} as const;

/** 채팅 패널 펼침 너비 — `ChatPanel` 의 `w-[400px]`·LeftSection `minWidth` 와 동기화 */
export const CHAT_PANEL_DOCKED_WIDTH = width.s1;

/**
 * 플랜 루트 콘텐츠 박스 인라인 폭이 이 값 미만이면 narrow(예: `PlanItemTimeForm` 아코디언).
 * `width.s1`(채팅·좌측 최소 400px) 과 맞춤.
 */
export const PLAN_CONTAINER_NARROW_MAX_INLINE_PX = 400 as const;

/**
 * `PlanPlaceCard` wide 레이아웃 브레이크포인트(px). 아래 `PLAN_PLACE_CARD_WIDE_TW` 문자열 안의 `@min-[…px]` 과 같게 유지.
 */
export const PLAN_PLACE_CARD_LAYOUT_WIDE_MIN_PX = 400 as const;

/**
 * `PlanPlaceCard` 컨테이너 쿼리 유틸 — 문자열은 **템플릿으로 만들지 말 것**
 * (`@min-[400px]` 처럼 소스에 그대로 적혀야 Tailwind v4가 CSS를 생성함).
 */
export const PLAN_PLACE_CARD_WIDE_TW = {
  articleFlexWide: "@min-[400px]/plan:flex-row @min-[400px]/plan:items-stretch",
  thumbnailWide:
    "@min-[400px]/plan:mx-0 @min-[400px]/plan:h-30 @min-[400px]/plan:w-30",
  narrowTitleRowWideHidden: "@min-[400px]/plan:hidden",
  wideTitleGridWide: "@min-[400px]/plan:grid",
} as const;

/** 플랜 구간(경로) 카드 가로 고정폭(px). 좌측 패널 max(s2) 기준 본문 영역 근사 */
export const PLAN_ROUTE_CARD_WIDTH_PX = 620 as const;
