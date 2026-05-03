/** `/user/queue/errors` — 채팅 등 실패 시 발신자 개인 에러 큐 (STOMP) */
export type UserErrorPayload = {
  action: string;
  clientRequestId: string;
  code: string;
  domain: string;
  message: string;
  retryable: boolean;
};

export function parseUserErrorMessage(body: string): UserErrorPayload | null {
  try {
    const raw = JSON.parse(body) as Record<string, unknown>;
    const action = raw?.action;
    const clientRequestId = raw?.clientRequestId;
    const code = raw?.code;
    const domain = raw?.domain;
    const message = raw?.message;
    const retryable = raw?.retryable;
    if (
      typeof action !== "string" ||
      typeof clientRequestId !== "string" ||
      typeof code !== "string" ||
      typeof domain !== "string" ||
      typeof message !== "string" ||
      typeof retryable !== "boolean"
    ) {
      return null;
    }
    return {
      action,
      clientRequestId,
      code,
      domain,
      message,
      retryable,
    };
  } catch {
    return null;
  }
}
