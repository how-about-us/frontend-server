import { parseFiniteNumber } from "@/lib/chat/normalizeServerChatMessage";
import { normalizeMessageKind } from "@/lib/chat/messageKind";
import type { AiRequestStatus, ServerChatMessage } from "@/types/chat";

const ALLOWED_AI_STATUS = new Set<string>(["QUEUED", "PROCESSING", "CANCELED"]);

function normalizeAiStatus(raw: string | undefined): AiRequestStatus | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const u = raw.trim().toUpperCase();
  return ALLOWED_AI_STATUS.has(u) ? (u as AiRequestStatus) : undefined;
}

function parseCancelable(meta: Record<string, string>): boolean {
  const v = meta.cancelable ?? meta.Cancelable;
  if (v === undefined) return false;
  return v === "true" || v === "1";
}

/**
 * 서버 메시지 id를 취소 STOMP `requestMessageId`로 쓸 수 있도록 정규화된 UI 메타.
 * `metadata.aiStatus`가 없으면 `aiStatus`만 생략(구 메시지).
 */
export function parseAiRequestUiMeta(
  msg: ServerChatMessage,
): {
  requestMessageId: string;
  aiStatus?: AiRequestStatus;
  cancelable: boolean;
  canceledBy?: number;
} | null {
  if (normalizeMessageKind(msg.messageType) !== "AI_REQUEST") return null;
  const meta = msg.metadata;
  if (!meta) {
    return {
      requestMessageId: msg.id,
      cancelable: false,
    };
  }
  const aiStatus = normalizeAiStatus(meta.aiStatus ?? meta.aistatus);
  const cancelable = parseCancelable(meta);
  const canceledByRaw = meta.canceledBy ?? meta.canceled_by;
  const canceledBy = parseFiniteNumber(canceledByRaw);

  return {
    requestMessageId: msg.id,
    ...(aiStatus !== undefined ? { aiStatus } : {}),
    cancelable,
    ...(canceledBy !== undefined ? { canceledBy } : {}),
  };
}

/** AI_RESPONSE 메타의 `requestMessageId` — 완료된 AI_REQUEST(서버 메시지 id) 식별 */
export function parseAiResponseRequestMessageId(
  msg: ServerChatMessage,
): string | undefined {
  const kind = normalizeMessageKind(msg.messageType);
  if (kind !== "AI_RESPONSE" && kind !== "AI") return undefined;
  const meta = msg.metadata;
  if (!meta) return undefined;
  const raw =
    meta.requestMessageId ??
    meta.request_message_id ??
    meta.requestmessageid;
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t.length > 0 ? t : undefined;
}
