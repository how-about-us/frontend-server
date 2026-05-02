"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Client, StompSubscription } from "@stomp/stompjs";
import { toast } from "sonner";
import Image from "next/image";

import { createStompClient, getStompBrokerURL } from "@/lib/stomp/client";
import { useSessionStore } from "@/stores/session-store";

interface RoomPresenceChangedEvent {
  nickname: string;
  profileImageUrl: string | null;
  roomId: string;
  type: "USER_CONNECTED" | "USER_DISCONNECTED";
  userId: number;
}

interface StompContextValue {
  client: Client | null;
  connected: boolean;
}

const StompContext = createContext<StompContextValue>({
  client: null,
  connected: false,
});

function PresenceToastIcon({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <Image
      src={url}
      alt=""
      width={24}
      height={24}
      className="h-6 w-6 rounded-full object-cover"
    />
  );
}

export function StompProvider({ children }: { children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const currentRoomId = useSessionStore((s) => s.currentRoomId);

  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const [contextValue, setContextValue] = useState<StompContextValue>({
    client: null,
    connected: false,
  });

  const subscribeToPresence = (client: Client, roomId: string) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    subscriptionRef.current = client.subscribe(
      `/topic/rooms/${roomId}/presence`,
      (message) => {
        try {
          const event: RoomPresenceChangedEvent = JSON.parse(message.body);
          const icon = <PresenceToastIcon url={event.profileImageUrl} />;

          if (event.type === "USER_CONNECTED") {
            toast(`${event.nickname}님이 입장했습니다`, {
              icon,
              duration: 3000,
            });
          } else {
            toast(`${event.nickname}님이 퇴장했습니다`, {
              icon,
              duration: 3000,
            });
          }
        } catch {
          // malformed message — ignore
        }
      },
    );
  };

  // STOMP 클라이언트 생성 및 연결 — user 로그인 여부에 따라 activate/deactivate
  useEffect(() => {
    if (!user) {
      if (clientRef.current) {
        subscriptionRef.current?.unsubscribe();
        subscriptionRef.current = null;
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setContextValue({ client: null, connected: false });
      return;
    }

    const client = createStompClient(getStompBrokerURL());
    clientRef.current = client;
    setContextValue({ client, connected: false });

    client.onConnect = () => {
      setContextValue({ client, connected: true });
      if (currentRoomId) {
        subscribeToPresence(client, currentRoomId);
      }
    };

    client.onDisconnect = () => {
      setContextValue((prev) => ({ ...prev, connected: false }));
    };

    client.onStompError = () => {
      setContextValue((prev) => ({ ...prev, connected: false }));
    };

    client.activate();

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      client.deactivate();
      clientRef.current = null;
    };
    // currentRoomId는 별도 effect에서 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // roomId 변경 시 구독 대상 교체
  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected) return;

    if (currentRoomId) {
      subscribeToPresence(client, currentRoomId);
    } else {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    }
  }, [currentRoomId]);

  return (
    <StompContext.Provider value={contextValue}>
      {children}
    </StompContext.Provider>
  );
}

export function useStompContext(): StompContextValue {
  return useContext(StompContext);
}
