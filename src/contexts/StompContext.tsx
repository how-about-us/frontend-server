"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Client } from "@stomp/stompjs";

import { createStompClient, getStompBrokerURL } from "@/lib/stomp/client";
import { subscribeRoomStompTopics } from "@/lib/stomp/subscribe-room-topics";
import { useSessionStore } from "@/stores/session-store";

interface StompContextValue {
  client: Client | null;
  connected: boolean;
}

const StompContext = createContext<StompContextValue>({
  client: null,
  connected: false,
});

export function StompProvider({ children }: { children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);

  useLayoutEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  const currentRoomIdRef = useRef(currentRoomId);
  useLayoutEffect(() => {
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  const clientRef = useRef<Client | null>(null);
  const roomTopicsUnsubRef = useRef<(() => void) | null>(null);
  const [contextValue, setContextValue] = useState<StompContextValue>({
    client: null,
    connected: false,
  });

  const unsubscribeRoomTopics = useCallback(() => {
    roomTopicsUnsubRef.current?.();
    roomTopicsUnsubRef.current = null;
  }, []);

  const subscribeToRoomTopics = useCallback(
    (client: Client, roomId: string) => {
      unsubscribeRoomTopics();
      roomTopicsUnsubRef.current = subscribeRoomStompTopics(
        client,
        roomId,
        queryClientRef,
      );
    },
    [unsubscribeRoomTopics],
  );

  /* STOMP 활성/비활성 시 컨텍스트와 동기화 — 동기 setState 패턴 허용 */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) {
      if (clientRef.current) {
        unsubscribeRoomTopics();
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
      const rid = currentRoomIdRef.current;
      if (rid) {
        subscribeToRoomTopics(client, rid);
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
      unsubscribeRoomTopics();
      client.deactivate();
      clientRef.current = null;
    };
  }, [subscribeToRoomTopics, unsubscribeRoomTopics, user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected) return;

    if (currentRoomId) {
      subscribeToRoomTopics(client, currentRoomId);
    } else {
      unsubscribeRoomTopics();
    }
  }, [currentRoomId, subscribeToRoomTopics, unsubscribeRoomTopics]);

  return (
    <StompContext.Provider value={contextValue}>
      {children}
    </StompContext.Provider>
  );
}

export function useStompContext(): StompContextValue {
  return useContext(StompContext);
}
