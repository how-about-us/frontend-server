import { getChatMessageChrome } from "@/components/chat/chat-message-chrome";
import { resolveChatMessageTypography } from "@/components/chat/chat-typography";

/** 메시지 목록 등 — 최소화에 따른 타이포 + 말풍선 크롬 */
export function getChatPanelLook(isMinimized: boolean) {
  return {
    typo: resolveChatMessageTypography(isMinimized),
    chrome: getChatMessageChrome(isMinimized),
  } as const;
}
