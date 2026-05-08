export const width = {
  s1: "400px",
  s2: "720px",
} as const;

/** 채팅 패널 펼침 너비 — `ChatPanel` 의 `w-[400px]`·LeftSection `minWidth` 와 동기화 */
export const CHAT_PANEL_DOCKED_WIDTH = width.s1;

/** 플랜 장소 카드: 이 너비 미만이면 세로 스택 — `width.s1`(검색·설정·좌측 최소·채팅 펼침 400px) 과 동일 */
export const PLAN_PLACE_CARD_WIDE_MIN_PX = 400 as const;

/** 플랜 구간(경로) 카드 가로 고정폭(px). 좌측 패널 max(s2) 기준 본문 영역 근사 */
export const PLAN_ROUTE_CARD_WIDTH_PX = 620 as const;
