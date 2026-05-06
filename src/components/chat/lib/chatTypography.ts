const AI_OVERLAY_INSET = "0.5rem" as const;
const AI_LABEL_WIDTH_CH = 3.35;

/**
 * 채팅 패널(메시지 목록·장소 카드·입력창) 텍스트 크기·행간·AI 라벨 여백.
 * 조정 시 이 객체만 수정하면 됩니다.
 */
export const chatTypography = {
  /** 상대·내·AI 말풍선 본문 */
  bubble: "text-xs leading-relaxed",
  /** 시스템(중앙 띠) 본문 */
  systemBody: "text-xs leading-relaxed",
  /** 닉네임·시간 등 보조 줄 */
  metaMuted: "text-[9px] leading-relaxed text-dark-gray",
  /** AI 응답 그룹 발신자 라벨 */
  wooriSenderLabel: "text-[9px] leading-relaxed text-green-500",
  /** CHAT 말풍선 내 AI_REQUEST 본문 앞 인라인 `@AI` (크기는 말풍선·bubble 상속) */
  aiRequestBubblePrefix: "font-medium text-green-300",
  /** 장소 공유 카드 제목 */
  placeTitle: "text-xs font-semibold leading-snug text-brand-green",
  /** 장소 카드 별점 */
  placeRating: "text-[10px] font-medium leading-relaxed text-[#364153]",
  /** 장소 카드 주소 */
  placeAddress: "text-[10px] leading-relaxed text-[#99A1AF]",
  /** 입력창·@AI 토글 라벨 */
  input: "text-xs leading-relaxed",
  /** AI 모드 입력창 위 파란 @AI 오버레이 */
  inputAiLabel: "text-xs leading-relaxed text-blue-500",

  aiOverlayInset: AI_OVERLAY_INSET,
  /** textarea `paddingLeft` — 오버레이와 겹치지 않게 */
  aiInputPaddingLeft: `calc(${AI_OVERLAY_INSET} + ${AI_LABEL_WIDTH_CH}ch)`,
} as const;
