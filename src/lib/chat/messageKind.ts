import type { ServerChatMessageType } from "@/types/chat";

const ALLOWED: ReadonlySet<string> = new Set([
  "CHAT",
  "AI_REQUEST",
  "AI_RESPONSE",
  "PLACE_SHARE",
  "SYSTEM",
  "AI",
]);

/** STOMP/REST 공통 — 공백·대소문자 정규화 */
export function normalizeMessageKind(
  raw: ServerChatMessageType | unknown,
): string {
  if (raw == null) return "CHAT";
  if (typeof raw !== "string") return "CHAT";
  const t = raw.trim();
  if (!t) return "CHAT";
  return t.toUpperCase();
}

export function coerceServerChatMessageType(
  raw: unknown,
): ServerChatMessageType {
  const k = normalizeMessageKind(raw as ServerChatMessageType);
  return ALLOWED.has(k) ? (k as ServerChatMessageType) : "CHAT";
}
