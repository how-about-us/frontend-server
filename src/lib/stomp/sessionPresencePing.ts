import type { Client } from "@stomp/stompjs";

const SESSION_PRESENCE_PING_INTERVAL_MS = 30_000;

/**
 * STOMP 연결 유지 중 주기적 `SEND /app/ping` (presence TTL·access 만료 검사).
 * 연결 해제·WebSocket close 시 반환된 stop을 호출해야 합니다.
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
