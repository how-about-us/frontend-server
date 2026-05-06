import { getChatMessageChrome } from "@/components/chat/lib/chatMessageChrome";
import { resolveChatMessageTypography } from "@/components/chat/lib/chatTypography";

/** 메시지 목록 등 — 최소화에 따른 타이포 + 말풍선 크롬 */
export function getChatPanelLook(isMinimized: boolean) {
  return {
    typo: resolveChatMessageTypography(isMinimized),
    chrome: getChatMessageChrome(isMinimized),
  } as const;
}
