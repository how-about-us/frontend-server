export type ChatMessageType = "other" | "mine" | "system" | "ai";

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  sender?: string;
  avatar?: string;
  text: string;
  time?: string;
}

export interface ServerChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  messageType: "CHAT" | "AI";
  content: string;
  metadata?: Record<string, string>;
  createdAt: string;
}
