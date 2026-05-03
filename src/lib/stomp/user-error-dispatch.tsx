"use client";

import { toast } from "sonner";

import type { UserErrorPayload } from "./user-error-events";

const USER_ERROR_TOAST_DURATION_MS = 4500;

/** `/user/queue/errors` 한 건 — 사용자에게 실패 안내 */
export function dispatchUserErrorToast(payload: UserErrorPayload): void {
  toast.error(payload.message, {
    duration: USER_ERROR_TOAST_DURATION_MS,
    ...(payload.retryable
      ? { description: "잠시 후 다시 시도해 주세요." }
      : {}),
  });
}
