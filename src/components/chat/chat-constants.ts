/** AI 요청 멘션 · 말풍선 접두 · 입력 오버레이 공통 라벨 */
export const CHAT_AI_MENTION_LABEL = "@ai" as const;

/** 백엔드 MessageContentValidator.MAX_CONTENT_LENGTH 와 동기화 */
export const CHAT_MESSAGE_MAX_LENGTH = 1000 as const;

export const CHAT_MESSAGE_TOO_LONG_TOAST =
  "메시지는 1000자 이하로 입력해주세요" as const;
