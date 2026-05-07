import { cn } from "@/lib/utils";

const AI_OVERLAY_INSET = "0.5rem" as const;
const AI_LABEL_WIDTH_CH = 1.5;

/** 말풍선·카드·입력 등 본문 (패널 일반 크기) */
export const chatTypographyMessage = {
  bubble: "text-xs leading-relaxed",
  systemBody: "text-xs leading-relaxed",
  metaMuted: "text-[9px] leading-relaxed text-dark-gray",
  wooriSenderLabel: "text-[9px] leading-relaxed text-green-500",
  aiRequestBubblePrefix: "font-medium text-green-300",
  placeTitle: "text-xs font-semibold leading-snug text-brand-green",
  placeRating: "text-[10px] font-medium leading-relaxed text-[#364153]",
  placeAddress: "text-[10px] leading-relaxed text-[#99A1AF]",
  input: "text-xs leading-relaxed",
  inputAiLabel: "text-xs leading-relaxed text-blue-500",
} as const;

/** 패널 최소화(좁은 폭) */
export const chatTypographyMinimized = {
  bubble: "text-[11px] leading-relaxed",
  systemBody: "text-[11px] leading-relaxed",
  metaMuted: "text-[8px] leading-relaxed text-dark-gray",
  wooriSenderLabel: "text-[8px] leading-relaxed text-green-500",
  aiRequestBubblePrefix: "text-[11px] font-medium text-green-300",
  placeTitle: "text-[11px] font-semibold leading-snug text-brand-green",
  placeRating: "text-[9px] font-medium leading-relaxed text-[#364153]",
  placeAddress: "text-[9px] leading-relaxed text-[#99A1AF]",
  input: "text-[11px] leading-relaxed",
  inputAiLabel: "text-[11px] leading-relaxed text-blue-500",
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
 * WOORI 녹색 말풍선 위 AI `**강조**` 톤 — 본문 흰색과 구분되되 채도 낮은 크림(별점 골드·브랜드 그린과 동조).
 */
export const chatAiBubbleEmphasisClass = "font-semibold text-[#f5ecd8]";

/** WOORI 녹색 말풍선 내 장소 추천·대화 요약 블록 타이포 (패널 최소화에 따라 크기만 바뀜) */
export function chatAiBubbleBlockTitleClass(isMinimized: boolean): string {
  return cn(
    "font-semibold text-white",
    isMinimized ? "text-[11px] leading-snug" : "text-xs leading-snug",
  );
}

export function chatAiBubbleBlockSubtitleClass(isMinimized: boolean): string {
  return cn(
    "text-white/80",
    isMinimized ? "text-[10px] leading-snug" : "text-[11px] leading-snug",
  );
}

export function chatAiBubbleSectionLabelClass(isMinimized: boolean): string {
  return cn(
    "font-semibold text-white",
    isMinimized ? "text-[10px]" : "text-[11px]",
  );
}

export function chatAiBubbleOverviewBodyClass(isMinimized: boolean): string {
  return cn(
    "leading-relaxed text-white/85",
    isMinimized ? "text-[10px]" : "text-[11px]",
  );
}

export function chatAiBubbleListTextClass(isMinimized: boolean): string {
  return cn(
    "text-white/85",
    isMinimized ? "text-[10px] leading-snug" : "text-[11px] leading-snug",
  );
}

export function chatAiBubbleMutedListClass(isMinimized: boolean): string {
  return cn(
    "space-y-1 text-white/80",
    isMinimized ? "text-[10px] leading-snug" : "text-[11px] leading-snug",
  );
}
