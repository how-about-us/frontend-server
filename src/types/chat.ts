export type ChatMessageType = "other" | "mine" | "system" | "ai";

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  sender?: string;
  text: string;
  time?: string;
  /** CHAT 타입일 때만 아바타·발신자 표시에 사용 */
  avatar?: string;
}

/** `/topic/rooms/{roomId}/messages` · GET /messages 응답 — 일반 말풍선은 CHAT 만 */
export type ServerChatMessageType =
  | "CHAT"
  | "AI_REQUEST"
  | "AI_RESPONSE"
  | "PLACE_SHARE"
  | "SYSTEM"
  | "AI";

export interface ServerChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  messageType: ServerChatMessageType;
  content: string;
  metadata?: Record<string, string>;
  createdAt: string;
  clientMessageId?: string;
}
