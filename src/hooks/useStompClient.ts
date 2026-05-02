import type { Client } from "@stomp/stompjs";
import { useStompContext } from "@/contexts/StompContext";

/**
 * 현재 활성화된 STOMP Client 인스턴스를 반환합니다.
 * 이후 추가될 /topic 또는 /user 구독이 필요한 컴포넌트에서 사용하세요.
 */
export function useStompClient(): Client | null {
  return useStompContext();
}
