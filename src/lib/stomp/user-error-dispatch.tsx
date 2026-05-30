"use client";

import { toast } from "sonner";

import {
  getRateLimitRetryAfterMs,
  isMessageRateLimit,
  type UserErrorPayload,
} from "./user-error-events";
import { useChatRateLimitStore } from "@/stores/chat-rate-limit-store";

const USER_ERROR_TOAST_DURATION_MS = 4500;

function dispatchUserErrorToast(payload: UserErrorPayload): void {
  toast.error(payload.message, {
    duration: USER_ERROR_TOAST_DURATION_MS,
    ...(payload.retryable
      ? { description: "잠시 후 다시 시도해 주세요." }
      : {}),
  });
}

/** `/user/queue/errors` 한 건 — rate limit은 패널 UI, 그 외 토스트 */
export function dispatchUserError(payload: UserErrorPayload): void {
  if (isMessageRateLimit(payload)) {
    const retryAfterMs = getRateLimitRetryAfterMs(payload);
    if (retryAfterMs > 0) {
      useChatRateLimitStore
        .getState()
        .applyRateLimit(payload.message, retryAfterMs);
    }
    return;
  }
  dispatchUserErrorToast(payload);
}
