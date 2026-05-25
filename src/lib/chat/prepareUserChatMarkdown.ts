/**
 * 사용자 채팅 본문 정규화 — 줄바꿈만 통일한다.
 * 공백·줄바꿈 표시는 렌더 단계(whitespace-pre-wrap)에서 처리한다.
 */
export function prepareUserChatMarkdown(text: string): string {
  return text.replace(/\r\n/g, "\n");
}
