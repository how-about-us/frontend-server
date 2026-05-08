import type { Client } from "@stomp/stompjs";

const SESSION_PRESENCE_PING_INTERVAL_MS = 30_000;

/**
 * 방 토픽 구독 후 세션 TTL 갱신용 fire-and-forget STOMP ping.
 * 구독 해제 시 반환된 stop을 호출해야 합니다.
 */
export function startSessionPresencePing(client: Client): () => void {
  let id: ReturnType<typeof setInterval> | null = null;

  const send = () => {
    if (!client.connected) return;
    client.publish({
      destination: "/app/ping",
      headers: { "content-type": "application/json" },
      body: JSON.stringify("ping"),
    });
  };

  send();
  id = setInterval(() => {
    if (!client.connected) {
      if (id != null) {
        clearInterval(id);
        id = null;
      }
      return;
    }
    send();
  }, SESSION_PRESENCE_PING_INTERVAL_MS);

  return () => {
    if (id != null) {
      clearInterval(id);
      id = null;
    }
  };
}
