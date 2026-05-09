export type ChatMessageType = "other" | "mine" | "system" | "ai" | "place";

/** `/topic` AI_REQUEST 확장 메타데이터 — `AI_REQUEST:{ clientMessageId, aiStatus, … }` */
export type AiRequestStatus = "QUEUED" | "PROCESSING" | "CANCELED";

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

/** AI_RESPONSE.place_recommendation — metadata.recommendedPlaces 항목 */
export interface AiRecommendedPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** `GET /places/photos?photoName=` — 없으면 클라이언트가 placeId로 보강 시도 */
  photoName?: string;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  reason?: string;
  googleMapsUri?: string;
}

export interface AiConversationSummarySection {
  type: string;
  title: string;
  items: string[];
}

export interface AiConversationSummaryMentionedPlace {
  name: string;
  source?: string;
  note?: string;
}

export interface AiConversationSummaryPayload {
  title: string;
  overview: string;
  sections?: AiConversationSummarySection[];
  mentionedPlaces?: AiConversationSummaryMentionedPlace[];
}

/** AI_RESPONSE.place_recommendation 블록 헤더(metadata.place_recommendation.title 등) */
export interface AiPlaceRecommendationHeading {
  title?: string;
  subtitle?: string;
}

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  sender?: string;
  text: string;
  time?: string;
  /** CHAT · 장소 공유 카드에서 아바타·발신자 표시에 사용 */
  avatar?: string;
  /** CHAT(mine/other) 그룹핑 · 장소 공유 좌우 정렬 — senderId 기준 */
  senderUserId?: number;
  /** PLACE_SHARE 타입일 때만 사용 — OG 카드 렌더 및 클릭 시 지도/디테일 패널 연동 */
  place?: PlaceShareData;
  /** AI_REQUEST(STOMP) 수신 시 본문 앞에 초록 `@AI` 접두 UI 표시 */
  isAiRequest?: boolean;
  /** AI_REQUEST — 취소 발행에는 `requestMessageId`(서버 메시지 id) 사용 */
  aiRequest?: {
    requestMessageId: string;
    aiStatus?: AiRequestStatus;
    cancelable: boolean;
    canceledBy?: number;
  };
  /** AI_RESPONSE — 원 질문으로 스크롤 시 `requestMessageId`는 서버 AI_REQUEST 메시지 id */
  aiRepliesTo?: {
    requestMessageId: string;
    quotePreview: string;
  };
  /** AI_RESPONSE — 서버 메타 `intent`(소문자 정규화) */
  aiIntent?: string;
  /** AI_RESPONSE — intent place_recommendation 시 장소 목록 */
  aiRecommendedPlaces?: AiRecommendedPlace[];
  /** AI_RESPONSE — place_recommendation.title / subtitle */
  aiPlaceRecommendationHeading?: AiPlaceRecommendationHeading;
  /** AI_RESPONSE — intent conversation_summary 시 구조 요약 */
  aiConversationSummary?: AiConversationSummaryPayload;
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
