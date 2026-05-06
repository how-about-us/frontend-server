export type ChatMessageType = "other" | "mine" | "system" | "ai" | "place";

/** PLACE_SHARE 메시지 페이로드 — STOMP send/recv 양쪽에서 동일 형태 */
export interface PlaceShareData {
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  photoName: string;
  rating: number;
}

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  sender?: string;
  text: string;
  time?: string;
  /** CHAT 타입일 때만 아바타·발신자 표시에 사용 */
  avatar?: string;
  /** CHAT(mine/other) 연속 말풍선 그룹핑 — 닉네임 캐시 갱신과 무관하게 senderId 기준 */
  senderUserId?: number;
  /** PLACE_SHARE 타입일 때만 사용 — OG 카드 렌더 및 클릭 시 지도/디테일 패널 연동 */
  place?: PlaceShareData;
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
