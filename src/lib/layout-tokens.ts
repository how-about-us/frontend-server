export const width = {
  s1: "400px",
  s2: "720px",
} as const;

/** 채팅 패널 펼침 너비 — `ChatPanel` 의 `w-[400px]`·LeftSection `minWidth` 와 동기화 */
export const CHAT_PANEL_DOCKED_WIDTH = width.s1;

/**
 * 플랜 루트 콘텐츠 박스 인라인 폭이 이 값 미만이면 narrow.
 * `width.s1`(채팅·좌측 최소 400px) 과 맞춤.
 */
export const PLAN_CONTAINER_NARROW_MAX_INLINE_PX = 400 as const;

/**
 * `PlanPlaceCard` wide 레이아웃·시간 인라인 배치 공통 브레이크포인트(px).
 * 입력 2개+저장 버튼이 info 컬럼에 들어갈 최소 폭 확보 — 아래 `@min-[…px]/plan` 과 같게 유지.
 */
export const PLAN_PLACE_CARD_LAYOUT_WIDE_MIN_PX = 370 as const;

/**
 * `PlanPlaceCard` 컨테이너 쿼리 유틸 — 문자열은 **템플릿으로 만들지 말 것**
 * (`@min-[370px]` 처럼 소스에 그대로 적혀야 Tailwind v4가 CSS를 생성함).
 */
export const PLAN_PLACE_CARD_TW = {
  article:
    "grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto] gap-x-2 gap-y-2.5 rounded-2xl border border-gray-border bg-white p-4 shadow-sm @min-[370px]/plan:min-h-30 @min-[370px]/plan:gap-x-3 @min-[370px]/plan:gap-y-1.5",
  thumbnail:
    "relative col-start-1 row-start-1 shrink-0 self-start overflow-hidden rounded-xl bg-brand-green/30 h-20 w-20 @min-[370px]/plan:row-span-2 @min-[370px]/plan:h-30 @min-[370px]/plan:w-30",
  infoColumn:
    "col-start-2 row-start-1 flex min-w-0 flex-col justify-start gap-0.5 self-start @min-[370px]/plan:gap-1",
  infoStack: "flex min-w-0 flex-col gap-0.5 @min-[370px]/plan:gap-1",
  timeCell:
    "col-span-2 col-start-1 row-start-2 min-w-0 overflow-hidden border-t border-gray-border/60 pt-2 @min-[370px]/plan:overflow-visible @min-[370px]/plan:col-span-1 @min-[370px]/plan:col-start-2 @min-[370px]/plan:row-start-2 @min-[370px]/plan:self-end @min-[370px]/plan:border-t-0 @min-[370px]/plan:pt-0",
  subtitleCompact:
    "truncate text-[11px] leading-snug text-dark-gray/90 @min-[370px]/plan:text-xs @min-[370px]/plan:leading-normal",
  orderBadgeCompact:
    "h-6 w-6 text-[10px] @min-[370px]/plan:h-7 @min-[370px]/plan:w-7 @min-[370px]/plan:text-xs",
  titleNarrowOnly: "@min-[370px]/plan:hidden",
  titleWideOnly: "hidden @min-[370px]/plan:grid",
  titleCompact: "text-sm @min-[370px]/plan:text-base",
  titleClampWide: "@min-[370px]/plan:line-clamp-2",
  subtitleClampWide: "@min-[370px]/plan:line-clamp-1",
  deleteButtonCompact:
    "p-1 @min-[370px]/plan:-mr-1 @min-[370px]/plan:-mt-0.5 @min-[370px]/plan:p-1.5",
  deleteIconCompact: "h-3.5 w-3.5 @min-[370px]/plan:h-4 @min-[370px]/plan:w-4",
  timeFieldLabelWideOnly: "hidden @min-[370px]/plan:block",
  timeFieldsRow:
    "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-1.5 @min-[370px]/plan:items-end @min-[370px]/plan:gap-2.5",
  timeField:
    "flex min-w-0 w-full flex-col gap-0.5 @min-[370px]/plan:gap-1",
  timeInputCompact:
    "h-7 min-w-0 w-full text-[11px] px-1.5 @min-[370px]/plan:h-8 @min-[370px]/plan:text-xs @min-[370px]/plan:px-2.5",
  timeSaveButtonCompact:
    "h-7 shrink-0 px-2 text-[11px] @min-[370px]/plan:h-8 @min-[370px]/plan:px-3 @min-[370px]/plan:text-xs",
  timeBorderPadding: "pt-0 @min-[370px]/plan:pt-2.5",
  timeBorderWideOnly:
    "border-t-0 @min-[370px]/plan:border-t @min-[370px]/plan:border-gray-border/60",
  overlapWarningCompact: "text-[10px] @min-[370px]/plan:text-[11px]",
} as const;

/** 플랜 구간(경로) 카드 가로 고정폭(px). 좌측 패널 max(s2) 기준 본문 영역 근사 */
export const PLAN_ROUTE_CARD_WIDTH_PX = 620 as const;

/** (main) 좌측 본문 — 사이드바 경계↔콘텐츠 좌측·콘텐츠 우측↔LeftSection 경계 (`MainContentScrollArea`) */
export const MAIN_PAGE_INLINE_PADDING_CLASS = "px-6" as const;
