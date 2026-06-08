import { MAX_SCHEDULES_PER_ROOM } from "@/lib/plan/schedulePolicy";

export const AGREEMENTS_NOT_ACCEPTED_ERROR_CODE = "AGREEMENTS_NOT_ACCEPTED";
export const AGREEMENTS_REACCEPTANCE_REQUIRED_ERROR_CODE =
  "AGREEMENTS_REACCEPTANCE_REQUIRED";

const AGREEMENTS_NOT_ACCEPTED_DEFAULT_MESSAGE =
  "변경된 약관에 동의해야 서비스를 이용할 수 있습니다.";

const AGREEMENTS_REACCEPTANCE_REQUIRED_DEFAULT_MESSAGE =
  "변경된 약관에 다시 동의해 주세요.";

/** 북마크 장소 중복 시 백엔드 JSON에 실을 수 있는 `code` / `errorCode` 값 (HTTP status와 별개) */
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

export function isScheduleLimitExceededFromBody(body: unknown): boolean {
  const raw = readApiErrorCodeFromJson(body);
  if (!raw) return false;
  return raw.toUpperCase().replace(/-/g, "_") === "SCHEDULE_LIMIT_EXCEEDED";
}

export function readNormalizedApiErrorCode(body: unknown): string | undefined {
  const raw = readApiErrorCodeFromJson(body);
  if (!raw) return undefined;
  return raw.toUpperCase().replace(/-/g, "_");
}

export function isAgreementsNotAcceptedFromBody(body: unknown): boolean {
  return (
    readNormalizedApiErrorCode(body) === AGREEMENTS_NOT_ACCEPTED_ERROR_CODE
  );
}

export function isAgreementsReacceptanceRequiredFromBody(
  body: unknown,
): boolean {
  return (
    readNormalizedApiErrorCode(body) ===
    AGREEMENTS_REACCEPTANCE_REQUIRED_ERROR_CODE
  );
}

/** Google 로그인·약관 재동의 API 오류 JSON → 사용자 메시지 */
export function messageForGoogleLoginError(
  body: unknown,
  fallback = "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
): string {
  if (isAgreementsNotAcceptedFromBody(body)) {
    return (
      readUserFacingMessageFromApiBody(body) ??
      AGREEMENTS_NOT_ACCEPTED_DEFAULT_MESSAGE
    );
  }
  if (isAgreementsReacceptanceRequiredFromBody(body)) {
    return (
      readUserFacingMessageFromApiBody(body) ??
      AGREEMENTS_REACCEPTANCE_REQUIRED_DEFAULT_MESSAGE
    );
  }
  return readUserFacingMessageFromApiBody(body) ?? fallback;
}

/** 약관 재동의 API 오류 JSON → 사용자 메시지 */
export function messageForAgreementsAcceptError(
  body: unknown,
  fallback = "약관 동의 처리에 실패했습니다.",
): string {
  return messageForGoogleLoginError(body, fallback);
}

/** `SCHEDULE_LIMIT_EXCEEDED` 등 — 서버 메시지에 30개 상한을 덧붙입니다. */
export function withScheduleLimitCountHint(
  message: string | undefined,
  body?: unknown,
): string {
  const base = message?.trim() || "최대 일정 개수를 초과했어요.";
  const isLimit =
    (body !== undefined && isScheduleLimitExceededFromBody(body)) ||
    /최대\s*일정|일정.*(초과|개수)|SCHEDULE_LIMIT/i.test(base);
  if (!isLimit) return base;
  if (base.includes(String(MAX_SCHEDULES_PER_ROOM))) return base;
  return `${base} (방당 최대 ${MAX_SCHEDULES_PER_ROOM}개까지예요.)`;
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

/** 북마크 카테고리명 중복(HTTP 409) 시 토스트용 문구 */
export function messageForBookmarkCategorySaveError(
  e: unknown,
  fallback: string,
): string {
  if (e instanceof HttpError && e.status === 409) {
    return "이미 존재하는 북마크명입니다";
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
