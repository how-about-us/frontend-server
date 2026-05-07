import { coerceServerChatMessageType } from "@/lib/chat/messageKind";
import type { ServerChatMessage } from "@/types/chat";

function readNonEmptyString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** REST/STOMP 페이로드에서 senderId · 멤버 매칭용 숫자 정규화 */
export function parseFiniteNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function normalizeMetadataRecord(
  raw: unknown,
): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof val === "string") out[k] = val;
    else if (typeof val === "number" && Number.isFinite(val))
      out[k] = String(val);
    else if (typeof val === "boolean") out[k] = val ? "true" : "false";
    else if (val !== null && typeof val === "object")
      out[k] = JSON.stringify(val);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * `/topic/rooms/{id}/messages` · GET /messages 공통 페이로드 정규화
 * (camelCase/snake_case, senderId 숫자·문자열)
 */
export function normalizeServerChatMessage(
  raw: unknown,
): ServerChatMessage | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const id = readNonEmptyString(r.id);
  const roomId = readNonEmptyString(r.roomId ?? r.room_id);
  if (!id || !roomId) return null;

  const messageType = coerceServerChatMessageType(
    r.messageType ?? r.message_type,
  );
  const content = typeof r.content === "string" ? r.content : "";

  const createdAt =
    typeof r.createdAt === "string"
      ? r.createdAt
      : typeof r.created_at === "string"
        ? r.created_at
        : "";

  const senderId =
    parseFiniteNumber(r.senderId ?? r.sender_id) ?? 0;

  const clientMessageId =
    typeof r.clientMessageId === "string"
      ? r.clientMessageId
      : typeof r.client_message_id === "string"
        ? r.client_message_id
        : undefined;

  const metadata = normalizeMetadataRecord(r.metadata);

  return {
    id,
    roomId,
    senderId,
    messageType,
    content,
    createdAt,
    clientMessageId,
    metadata,
  };
}
