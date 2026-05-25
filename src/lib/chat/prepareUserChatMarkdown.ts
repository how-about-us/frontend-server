/**
 * 사용자 채팅 Markdown 렌더 전 — 줄바꿈·연속 공백을 화면에 가깝게 보존.
 * Markdown 특수문자는 건드리지 않는다.
 */
export function prepareUserChatMarkdown(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");
  return normalized.replace(/ {2,}/g, (run) =>
    " " + "\u00a0".repeat(run.length - 1),
  );
}
