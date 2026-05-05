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
import { useRouter } from "next/navigation";
import type { Client } from "@stomp/stompjs";
import { toast } from "sonner";

import { createStompClient, getStompBrokerURL } from "@/lib/stomp/client";
import { subscribeRoomStompTopics } from "@/lib/stomp/subscribe-room-topics";
import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";
import { useRoomPresenceStore } from "@/stores/room-presence-store";
import { useSessionStore } from "@/stores/session-store";

interface StompContextValue {
  client: Client | null;
  connected: boolean;
}

const StompContext = createContext<StompContextValue>({
  client: null,
  connected: false,
});

const FORCED_ROOM_EXIT_TOAST_MS = 4500;

export function StompProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
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
  const lastSubscribedRoomIdRef = useRef<string | null>(null);
  const [contextValue, setContextValue] = useState<StompContextValue>({
    client: null,
    connected: false,
  });

  const detachRoomTopicsOnly = useCallback(() => {
    roomTopicsUnsubRef.current?.();
    roomTopicsUnsubRef.current = null;
  }, []);

  const unsubscribeRoomTopics = useCallback(() => {
    const rid = lastSubscribedRoomIdRef.current;
    detachRoomTopicsOnly();
    if (rid) {
      useRoomPresenceStore.getState().resetRoom(rid);
      lastSubscribedRoomIdRef.current = null;
    }
  }, [detachRoomTopicsOnly]);

  const handleForcedRoomExit = useCallback(
    (reason: "kicked" | "room_deleted") => {
      const message =
        reason === "kicked"
          ? "방장에 의해 강제 퇴장 당했습니다"
          : "방장에 의해 방이 삭제되었습니다";
      toast(message, { duration: FORCED_ROOM_EXIT_TOAST_MS });

      unsubscribeRoomTopics();

      const session = useSessionStore.getState();
      session.clearCurrentRoomId();
      session.clearCurrentRoomInviteCode();
      session.clearCurrentRoomMeta();

      router.replace("/home");
    },
    [router, unsubscribeRoomTopics],
  );

  const subscribeToRoomTopics = useCallback(
    (client: Client, roomId: string) => {
      const rid = roomId.trim();
      const prevRoom = lastSubscribedRoomIdRef.current;
      detachRoomTopicsOnly();
      if (prevRoom && prevRoom !== rid) {
        useRoomPresenceStore.getState().resetRoom(prevRoom);
      }
      roomTopicsUnsubRef.current = subscribeRoomStompTopics(
        client,
        rid,
        queryClientRef,
        { onForcedRoomExit: handleForcedRoomExit },
      );
      lastSubscribedRoomIdRef.current = rid;
      const uid = useSessionStore.getState().user?.id;
      if (uid != null) {
        useRoomPresenceStore.getState().setUserOnline(rid, uid);
      }
    },
    [detachRoomTopicsOnly, handleForcedRoomExit],
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
      useRoomPresenceStore.getState().clearAll();
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
        // 재연결 구간에 missed된 이벤트 보완
        void queryClientRef.current.invalidateQueries({
          queryKey: roomSchedulesQueryKey(rid),
          refetchType: "active",
        });
        void queryClientRef.current.invalidateQueries({
          queryKey: ["schedule-items", rid],
          refetchType: "active",
        });
        void queryClientRef.current.invalidateQueries({
          queryKey: ["schedule-item-route", rid],
          refetchType: "active",
        });
      }
    };

    client.onDisconnect = () => {
      const rid = currentRoomIdRef.current;
      const uid = useSessionStore.getState().user?.id;
      if (rid != null && uid != null) {
        useRoomPresenceStore.getState().setUserOffline(rid, uid);
      }
      setContextValue((prev) => ({ ...prev, connected: false }));
    };

    client.onStompError = () => {
      const rid = currentRoomIdRef.current;
      const uid = useSessionStore.getState().user?.id;
      if (rid != null && uid != null) {
        useRoomPresenceStore.getState().setUserOffline(rid, uid);
      }
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
