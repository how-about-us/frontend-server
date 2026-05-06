/**
 * 채팅 메시지 말풍선·아바타 래퍼 등 레이아웃·배경 토큰.
 * 글자 크기·행간은 `chatTypography` 를 사용합니다.
 */
export const chatMessageChrome = {
  bubbleBase: "w-fit rounded-xl px-4 py-2",
  otherBubble: "bg-bubble-gray text-black",
  mineBubble: "bg-brand-red text-white",
  aiBubble: "bg-brand-green/70 text-white",
  systemPill:
    "my-1.5 max-w-[min(100%,20rem)] rounded-full bg-black/25 px-4 py-2 text-center text-white",
  avatarSm: "h-10 w-10 shrink-0 overflow-hidden rounded-xl",
  wooriIconSrc: "/icons/woori.svg",
} as const;
