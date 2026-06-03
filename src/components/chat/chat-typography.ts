import { cn } from "@/lib/utils";

const AI_OVERLAY_INSET = "0.5rem" as const;
const AI_LABEL_WIDTH_CH = 1.5;

/** 말풍선·카드·입력 등 본문 (패널 일반 크기) */
const chatTypographyMessage = {
  bubble: "text-xs leading-relaxed",
  systemBody: "text-xs leading-relaxed",
  metaMuted: "text-[9px] leading-relaxed text-dark-gray",
  wooriSenderLabel: "text-[9px] font-medium leading-relaxed text-brand-red",
  aiRequestBubblePrefix: "text-xs font-semibold leading-relaxed text-brand-green",
  placeTitle: "text-xs font-semibold leading-snug text-brand-green",
  placeRating: "text-[10px] font-medium leading-relaxed text-[#364153]",
  placeAddress: "text-[10px] leading-relaxed text-[#99A1AF]",
  input: "text-xs leading-relaxed",
  inputAiLabel: "text-xs leading-relaxed text-brand-green font-semibold",
} as const;

/** 패널 최소화(좁은 폭) */
const chatTypographyMinimized = {
  bubble: "text-[11px] leading-relaxed",
  systemBody: "text-[11px] leading-relaxed",
  metaMuted: "text-[8px] leading-relaxed text-dark-gray",
  wooriSenderLabel: "text-[8px] font-medium leading-relaxed text-brand-red",
  aiRequestBubblePrefix: "text-[11px] font-semibold leading-relaxed text-brand-green",
  placeTitle: "text-[11px] font-semibold leading-snug text-brand-green",
  placeRating: "text-[9px] font-medium leading-relaxed text-[#364153]",
  placeAddress: "text-[9px] leading-relaxed text-[#99A1AF]",
  input: "text-[11px] leading-relaxed",
  inputAiLabel: "text-[11px] leading-relaxed text-brand-green font-semibold",
} as const;

export type ChatMessageTextTypography =
  | typeof chatTypographyMessage
  | typeof chatTypographyMinimized;

/**
 * 채팅 패널 타이포 — 메시지/카드/입력 + textarea 오버레이 여백.
 * 최소화 시 본문만 축소; 오버레이 들여쓰기 토큰은 동일.
 */
export const chatTypography = {
  ...chatTypographyMessage,
  aiOverlayInset: AI_OVERLAY_INSET,
  aiInputPaddingLeft: `calc(${AI_OVERLAY_INSET} + ${AI_LABEL_WIDTH_CH}ch)`,
} as const;

export function resolveChatMessageTypography(
  isMinimized: boolean,
): ChatMessageTextTypography {
  return isMinimized ? chatTypographyMinimized : chatTypographyMessage;
}

/**
 * AI 응답 말풍선(밝은 배경) 위 `**강조**` — 진한 본문과 대비되게 브랜드 그린으로 강조.
 */
export const chatAiBubbleEmphasisClass = "font-semibold text-brand-green";

/** AI 응답 말풍선(밝은 배경) 내 대화 요약 등 블록 제목 */
export function chatAiBubbleBlockTitleClass(isMinimized: boolean): string {
  return cn(
    "font-semibold text-gray-900",
    isMinimized ? "text-[11px] leading-snug" : "text-xs leading-snug",
  );
}

export function chatAiBubbleSectionLabelClass(isMinimized: boolean): string {
  return cn(
    "font-semibold text-gray-900",
    isMinimized ? "text-[10px]" : "text-[11px]",
  );
}

export function chatAiBubbleOverviewBodyClass(isMinimized: boolean): string {
  return cn(
    "leading-relaxed text-gray-700",
    isMinimized ? "text-[10px]" : "text-[11px]",
  );
}

export function chatAiBubbleListTextClass(isMinimized: boolean): string {
  return cn(
    "text-gray-800",
    isMinimized ? "text-[10px] leading-snug" : "text-[11px] leading-snug",
  );
}

export function chatAiBubbleMutedListClass(isMinimized: boolean): string {
  return cn(
    "space-y-1 text-gray-600",
    isMinimized ? "text-[10px] leading-snug" : "text-[11px] leading-snug",
  );
}

/** AI 장소 추천 블록·reason 공통 `**강조**` — 본문 슬레이트 톤과 어울리는 브랜드 그린 */
export const chatAiBubblePlaceRecommendationEmphasisClass =
  "font-semibold text-brand-green";

/** 장소 추천 블록 헤더 `heading.title` — 본문·reason과 맞춘 어두운 계열 */
export function chatAiBubblePlaceRecommendationHeadingTitleClass(
  isMinimized: boolean,
): string {
  return cn(
    "font-semibold leading-snug text-[#0f172a]",
    isMinimized ? "text-[11px]" : "text-xs",
  );
}

/** 장소 추천 블록 헤더 `heading.subtitle` (예: 요청 맥락 안내 문장) */
export function chatAiBubblePlaceRecommendationHeadingSubtitleClass(
  isMinimized: boolean,
): string {
  return cn(
    "font-normal leading-relaxed text-[#1e293b]",
    isMinimized ? "text-[11px]" : "text-xs",
  );
}

/** AI 장소 추천 행 카드 아래 `reason`(장소 설명) 본문 — 말풍선 위에서 일반 본문처럼 읽히도록 어두운 색 */
export function chatAiBubblePlaceRecommendationReasonClass(
  isMinimized: boolean,
): string {
  return cn(
    "font-normal leading-relaxed text-[#1e293b]",
    isMinimized ? "text-[10px]" : "text-[11px]",
  );
}
