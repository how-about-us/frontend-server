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

/** `PlanPlaceCard` 접힌 상태 기준 최소 높이·썸네일 한 변(px) — 사진·본문 열 동기화 */
export const PLAN_PLACE_CARD_MIN_SIZE_REM = "7rem" as const;

/**
 * `PlanPlaceCard` 컨테이너 쿼리 유틸 — 문자열은 **템플릿으로 만들지 말 것**
 * (`@min-[370px]` 처럼 소스에 그대로 적혀야 Tailwind v4가 CSS를 생성함).
 */
export const PLAN_PLACE_CARD_TW = {
  article:
    "grid grid-cols-[auto_minmax(0,1fr)] items-stretch gap-x-3 rounded-xl border border-gray-border bg-white p-3 shadow-sm",
  thumbnail:
    "relative h-full w-[7rem] min-h-[7rem] shrink-0 self-stretch overflow-hidden rounded-lg bg-brand-green/30",
  contentColumn:
    "flex min-h-[7rem] min-w-0 flex-col justify-start gap-2",
  titleRow: "mb-1.5 flex min-w-0 items-start gap-2",
  subtitle: "text-[10px] leading-snug text-dark-gray/85",
  controlsStack: "flex min-w-0 flex-col gap-0.5",
  orderBadgeCompact:
    "h-6 w-6 text-[11px] @min-[370px]/plan:h-7 @min-[370px]/plan:w-7 @min-[370px]/plan:text-xs",
  titleCompact: "text-[13px] font-semibold leading-snug text-gray-900",
  titleClamp: "line-clamp-2",
  subtitleClamp: "line-clamp-2",
  deleteButtonCompact: "p-0.5 @min-[370px]/plan:p-1",
  deleteIconCompact: "h-3.5 w-3.5",
  timeFieldLabel: "text-[10px] font-medium leading-none text-dark-gray/90",
  timeFieldsRow:
    "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-1 @min-[370px]/plan:gap-1.5",
  timeField: "flex min-w-0 w-full flex-col gap-0.5",
  timeInputCompact:
    "h-6 min-w-0 w-full text-[11px] px-1.5 @min-[370px]/plan:h-7 @min-[370px]/plan:px-2",
  timeSaveButtonCompact:
    "h-6 shrink-0 px-2 text-[10px] @min-[370px]/plan:h-7 @min-[370px]/plan:px-2.5 @min-[370px]/plan:text-[11px]",
  sectionToggle:
    "flex w-full min-w-0 items-center gap-1 rounded-md px-1 py-0.5 text-left text-[10px] font-medium text-dark-gray/80 transition hover:bg-gray-50 hover:text-dark-gray",
  sectionToggleHint: "min-w-0 flex-1 truncate font-normal text-dark-gray/60",
  memoTextarea:
    "min-h-[1.75rem] max-h-20 w-full resize-y rounded-md border border-gray-border bg-gray-50/60 px-2 py-1 text-[11px] leading-snug text-gray-900 shadow-none transition placeholder:text-dark-gray/45 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green/30",
  overlapWarningCompact: "text-[10px] leading-tight",
} as const;

/** 플랜 구간(경로) 카드 가로 고정폭(px). 좌측 패널 max(s2) 기준 본문 영역 근사 */
export const PLAN_ROUTE_CARD_WIDTH_PX = 620 as const;

/** (main) 좌측 본문 — 사이드바 경계↔콘텐츠 좌측·콘텐츠 우측↔LeftSection 경계 (`MainContentScrollArea`) */
export const MAIN_PAGE_INLINE_PADDING_CLASS = "px-6" as const;
