import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { clientEnv } from "@/lib/client-env";

/**
 * NEXT_PUBLIC_API_BASE_URL 기반으로 SockJS HTTP URL을 반환합니다.
 * 백엔드가 .withSockJS()로 설정되어 있으므로 ws:// 대신 http:// 를 사용합니다.
 */
export function getStompBrokerURL(): string {
  return `${clientEnv.NEXT_PUBLIC_API_BASE_URL}/ws`;
}

export function createStompClient(httpURL: string): Client {
  return new Client({
    webSocketFactory: () => new SockJS(httpURL),
    reconnectDelay: 5000,
  });
}
