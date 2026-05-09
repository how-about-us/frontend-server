/** 보관함 장소 중복 시 백엔드 JSON에 실을 수 있는 `code` / `errorCode` 값 (HTTP status와 별개) */
const ROOM_BOOKMARK_DUPLICATE_ERROR_CODES = new Set<string>([
  "BOOKMARK_ALREADY_EXISTS",
  "BOOKMARK_DUPLICATE",
  "DUPLICATE_BOOKMARK",
  "ROOM_BOOKMARK_DUPLICATE",
]);

function readApiErrorCodeFromJson(body: unknown): string | undefined {
  if (body === null || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  const direct = o.code ?? o.errorCode;
  if (typeof direct === "string" && direct.length > 0) return direct.trim();
  if (typeof direct === "number" && Number.isFinite(direct))
    return String(direct);
  if (typeof o.error === "string" && o.error.length > 0) return o.error.trim();
  const nested = o.error;
  if (nested !== null && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    const c = n.code ?? n.errorCode;
    if (typeof c === "string" && c.length > 0) return c.trim();
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
  }
  return undefined;
}

export function isRoomBookmarkDuplicateFromBody(body: unknown): boolean {
  const raw = readApiErrorCodeFromJson(body);
  if (!raw) return false;
  const normalized = raw.toUpperCase().replace(/-/g, "_");
  return ROOM_BOOKMARK_DUPLICATE_ERROR_CODES.has(normalized);
}

/** HTTP error JSON에서 사용자에게 그대로 보여줄 메시지 추출 (Spring `message` / `errors` 등) */
export function readUserFacingMessageFromApiBody(
  body: unknown,
): string | undefined {
  if (body === null || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  const detail = o.message ?? o.detail;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  const nested = o.error;
  if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
    const n = nested as Record<string, unknown>;
    const nm = n.message;
    if (typeof nm === "string" && nm.trim()) return nm.trim();
  }
  const errors = o.errors;
  if (errors !== null && typeof errors === "object" && !Array.isArray(errors)) {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) return v.trim();
      if (Array.isArray(v)) {
        const first = v.find((x) => typeof x === "string" && x.trim());
        if (typeof first === "string") return first.trim();
      }
    }
  }
  return undefined;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
