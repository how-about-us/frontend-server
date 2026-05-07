import { pickProfileImageUrl } from "@/lib/api/profileImage";
import type { RoomMember } from "@/lib/api/rooms";
import { normalizeMessageKind } from "@/lib/chat/messageKind";
import {
  parseAiRequestUiMeta,
  parseAiResponseRequestMessageId,
} from "@/lib/chat/aiRequestMetadata";
import {
  aiResponseDisplayText,
  aiResponseStructuredToPartialFields,
} from "@/lib/chat/aiResponseUiMapping";
import { parseAiResponseStructuredMeta } from "@/lib/chat/aiResponseMetadata";
import { parseFiniteNumber } from "@/lib/chat/normalizeServerChatMessage";
import type { ChatMessage, PlaceShareData, ServerChatMessage } from "@/types/chat";

/** `toUiMessage` 멤버 매칭용 — 훅에서 room members 로 구축 */
export type ChatMemberMap = Map<
  number,
  Pick<RoomMember, "nickname" | "profileImageUrl">
>;

export type AiRequestReplyLookupEntry = { anchorId: string; quotePreview: string };

function formatQuotePreview(content: string, maxLen = 96): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine || "질문";
  return `${oneLine.slice(0, maxLen).trimEnd()}…`;
}

function preferNewerServerMessage(
  a: ServerChatMessage,
  b: ServerChatMessage,
): ServerChatMessage {
  if (!a.createdAt) return b;
  if (!b.createdAt) return a;
  return b.createdAt >= a.createdAt ? b : a;
}

/** 같은 id 는 하나만 유지(타임스탬프가 더 최신인 행). */
export function mergeServerMessageLists(
  ...lists: ServerChatMessage[][]
): ServerChatMessage[] {
  const map = new Map<string, ServerChatMessage>();
  for (const list of lists) {
    for (const m of list) {
      const prev = map.get(m.id);
      if (!prev) {
        map.set(m.id, m);
        continue;
      }
      map.set(m.id, preferNewerServerMessage(prev, m));
    }
  }
  return [...map.values()].sort((x, y) => x.createdAt.localeCompare(y.createdAt));
}

function buildAiRequestReplyLookup(
  rawMessages: ServerChatMessage[],
): Map<string, AiRequestReplyLookupEntry> {
  const map = new Map<string, AiRequestReplyLookupEntry>();
  for (const m of rawMessages) {
    if (normalizeMessageKind(m.messageType) !== "AI_REQUEST") continue;
    const preview = formatQuotePreview(m.content);
    const entry: AiRequestReplyLookupEntry = {
      anchorId: m.id,
      quotePreview: preview,
    };
    map.set(m.id, entry);
    const cmid =
      m.metadata?.clientMessageId?.trim() ||
      m.metadata?.client_message_id?.trim() ||
      "";
    if (cmid !== "") map.set(cmid, entry);
  }
  return map;
}

function buildFulfilledAiRequestIds(
  rawMessages: ServerChatMessage[],
): Set<string> {
  const s = new Set<string>();
  for (const m of rawMessages) {
    const reqRef = parseAiResponseRequestMessageId(m);
    if (!reqRef) continue;
    s.add(reqRef);
    for (const r of rawMessages) {
      if (normalizeMessageKind(r.messageType) !== "AI_REQUEST") continue;
      const meta = r.metadata;
      const cmid =
        meta?.clientMessageId?.trim() ||
        meta?.client_message_id?.trim() ||
        "";
      if (cmid !== "" && cmid === reqRef) {
        s.add(r.id);
      }
    }
  }
  return s;
}

/**
 * AI_REQUEST 처리 상태·답장 인용에 필요한 파생 값을 한 번에 계산
 * (`fulfilled` 집합 + 질문 미리보기 lookup).
 */
export function deriveAiRequestConversationState(rawMessages: ServerChatMessage[]): {
  fulfilledAiRequestIds: Set<string>;
  aiRequestReplyLookup: Map<string, AiRequestReplyLookupEntry>;
} {
  return {
    fulfilledAiRequestIds: buildFulfilledAiRequestIds(rawMessages),
    aiRequestReplyLookup: buildAiRequestReplyLookup(rawMessages),
  };
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function parsePlaceShareMetadata(
  metadata: Record<string, string> | undefined,
): PlaceShareData | null {
  if (!metadata) return null;
  const lat = Number(metadata.latitude);
  const lng = Number(metadata.longitude);
  const rating = Number(metadata.rating);
  const googlePlaceId = metadata.googlePlaceId ?? "";
  const name = metadata.name ?? "";
  if (!googlePlaceId || !name || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return {
    googlePlaceId,
    name,
    formattedAddress: metadata.formattedAddress ?? "",
    latitude: lat,
    longitude: lng,
    photoName: metadata.photoName ?? "",
    rating: Number.isNaN(rating) ? 0 : rating,
  };
}

export function serverMessageToChatMessage(
  msg: ServerChatMessage,
  currentUserId: number | undefined,
  memberMap: ChatMemberMap,
  fulfilledAiRequestIds: ReadonlySet<string>,
  aiRequestReplyLookup: ReadonlyMap<string, AiRequestReplyLookupEntry>,
): ChatMessage {
  const kind = normalizeMessageKind(msg.messageType);
  const time = formatTime(msg.createdAt) || undefined;

  if (kind === "PLACE_SHARE") {
    const place = parsePlaceShareMetadata(msg.metadata);
    const senderUserId = parseFiniteNumber(msg.senderId) ?? msg.senderId;
    const member = memberMap.get(senderUserId);
    const meta = msg.metadata;
    const metaNick =
      typeof meta?.nickname === "string"
        ? meta.nickname.trim()
        : typeof meta?.senderNickname === "string"
          ? meta.senderNickname.trim()
          : "";
    const metaAvatar =
      meta != null
        ? pickProfileImageUrl(meta as unknown as Record<string, unknown>)
        : null;
    const displayNick =
      member?.nickname?.trim() ||
      (metaNick.length > 0 ? metaNick : undefined);

    if (place) {
      return {
        id: msg.id,
        type: "place",
        text: msg.content || "장소 공유",
        time,
        sender: displayNick,
        senderUserId,
        avatar: member?.profileImageUrl ?? metaAvatar ?? undefined,
        place,
      };
    }
    return {
      id: msg.id,
      type: "system",
      text: msg.content || "장소 공유",
      time,
      sender: `system:${msg.id}`,
    };
  }

  if (kind === "SYSTEM") {
    return {
      id: msg.id,
      type: "system",
      text: msg.content,
      time,
      sender: `system:${msg.id}`,
    };
  }

  if (kind === "AI_RESPONSE" || kind === "AI") {
    const ref = parseAiResponseRequestMessageId(msg);
    const reply = ref ? aiRequestReplyLookup.get(ref) : undefined;
    const structured = parseAiResponseStructuredMeta(msg.metadata);

    return {
      id: msg.id,
      type: "ai",
      text: aiResponseDisplayText(msg.content, structured),
      time,
      sender: "WOORI",
      ...(reply
        ? {
            aiRepliesTo: {
              requestMessageId: reply.anchorId,
              quotePreview: reply.quotePreview,
            },
          }
        : {}),
      ...aiResponseStructuredToPartialFields(structured),
    };
  }

  if (kind === "CHAT" || kind === "AI_REQUEST") {
    const senderUserId = parseFiniteNumber(msg.senderId) ?? msg.senderId;
    const member = memberMap.get(senderUserId);
    const meta = msg.metadata;
    const metaNick =
      typeof meta?.nickname === "string"
        ? meta.nickname.trim()
        : typeof meta?.senderNickname === "string"
          ? meta.senderNickname.trim()
          : "";
    const metaAvatar =
      meta != null
        ? pickProfileImageUrl(meta as unknown as Record<string, unknown>)
        : null;

    const uid = parseFiniteNumber(currentUserId);
    const isMine = uid !== undefined && senderUserId === uid;

    const displayNick =
      member?.nickname?.trim() ||
      (metaNick.length > 0 ? metaNick : undefined);

    const aiReqMeta =
      kind === "AI_REQUEST" ? parseAiRequestUiMeta(msg) : null;
    const fulfilledByResponse =
      kind === "AI_REQUEST" && fulfilledAiRequestIds.has(msg.id);

    return {
      id: msg.id,
      type: isMine ? "mine" : "other",
      sender: displayNick,
      senderUserId,
      avatar: member?.profileImageUrl ?? metaAvatar ?? undefined,
      text: msg.content,
      time,
      ...(kind === "AI_REQUEST"
        ? {
            isAiRequest: true as const,
            ...(aiReqMeta
              ? {
                  aiRequest: fulfilledByResponse
                    ? {
                        requestMessageId: aiReqMeta.requestMessageId,
                        cancelable: false,
                      }
                    : aiReqMeta,
                }
              : {}),
          }
        : {}),
    };
  }

  return {
    id: msg.id,
    type: "system",
    text: msg.content,
    time,
    sender: `system:${msg.id}`,
  };
}
