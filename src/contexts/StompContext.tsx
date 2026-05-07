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
import { usePathname, useRouter } from "next/navigation";
import type { Client } from "@stomp/stompjs";
import { toast } from "sonner";

import { createStompClient, getStompBrokerURL } from "@/lib/stomp/client";
import { invalidateRoomQueriesAfterStompReconnect } from "@/lib/stomp/invalidateRoomQueriesAfterStompReconnect";
import {
  pathDefersRoomStompRoomTopics,
  pathSuspendsStomp,
} from "@/lib/stomp/stompPathPolicy";
import { subscribeRoomStompTopics } from "@/lib/stomp/subscribe-room-topics";
import { subscribeUserRoomsQueue } from "@/lib/stomp/subscribe-user-rooms-queue";
import type { ForcedRoomExitReason } from "@/lib/stomp/user-room-queue";
import { useSessionStore } from "@/stores/session-store";
import { useChatUnreadStore } from "@/stores/chat-unread-store";
import type { ServerChatMessage } from "@/types/chat";

interface StompConnectionState {
  client: Client | null;
  connected: boolean;
}

interface StompContextValue extends StompConnectionState {
  setRoomChatMessageHandler: (
    fn: ((msg: ServerChatMessage) => void) | null,
  ) => void;
}

const StompContext = createContext<StompContextValue>({
  client: null,
  connected: false,
  setRoomChatMessageHandler: () => {},
});

const FORCED_ROOM_EXIT_TOAST_MS = 4500;

export function StompProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  const pathnameRef = useRef(pathname);
  useLayoutEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const clientRef = useRef<Client | null>(null);
  const roomTopicsUnsubRef = useRef<(() => void) | null>(null);
  const userRoomsQueueUnsubRef = useRef<(() => void) | null>(null);
  const forcedExitConsumedRef = useRef(false);
  const [connectionState, setConnectionState] = useState<StompConnectionState>({
    client: null,
    connected: false,
  });

  const detachRoomTopicsOnly = useCallback(() => {
    roomTopicsUnsubRef.current?.();
    roomTopicsUnsubRef.current = null;
  }, []);

  const unsubscribeRoomTopics = useCallback(() => {
    detachRoomTopicsOnly();
    useChatUnreadStore.getState().resetChatCnt();
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

  const notifyForcedRoomExit = useCallback(
    (reason: ForcedRoomExitReason, eventRoomId: string) => {
      const cur = currentRoomIdRef.current?.trim() ?? null;
      if (!cur || eventRoomId.trim() !== cur) return;
      if (forcedExitConsumedRef.current) return;
      forcedExitConsumedRef.current = true;
      handleForcedRoomExit(reason);
    },
    [handleForcedRoomExit],
  );

  const roomChatMessageHandlerRef = useRef<
    ((msg: ServerChatMessage) => void) | null
  >(null);

  const onRoomChatMessage = useCallback((msg: ServerChatMessage) => {
    roomChatMessageHandlerRef.current?.(msg);
  }, []);

  const setRoomChatMessageHandler = useCallback(
    (fn: ((msg: ServerChatMessage) => void) | null) => {
      roomChatMessageHandlerRef.current = fn;
    },
    [],
  );

  const subscribeToRoomTopics = useCallback(
    (client: Client, roomId: string) => {
      const rid = roomId.trim();
      useChatUnreadStore.getState().resetChatCnt();
      detachRoomTopicsOnly();
      forcedExitConsumedRef.current = false;
      roomTopicsUnsubRef.current = subscribeRoomStompTopics(
        client,
        rid,
        queryClientRef,
        { notifyForcedRoomExit, onRoomChatMessage },
      );
    },
    [detachRoomTopicsOnly, notifyForcedRoomExit, onRoomChatMessage],
  );

  const teardownConnectedClient = useCallback(() => {
    unsubscribeRoomTopics();
    userRoomsQueueUnsubRef.current?.();
    userRoomsQueueUnsubRef.current = null;
    clientRef.current?.deactivate();
    clientRef.current = null;
  }, [unsubscribeRoomTopics]);

  /** 로그인 + (waiting/join 제외)일 때만 WebSocket 유지 — /home ↔ 플랜 등 경로 전환만으로는 재연결하지 않음 */
  const stompEligible = Boolean(user && !pathSuspendsStomp(pathname));

  /* STOMP 활성/비활성 시 컨텍스트와 동기화 — 동기 setState 패턴 허용 */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!stompEligible) {
      teardownConnectedClient();
      setConnectionState({ client: null, connected: false });
      return;
    }

    if (clientRef.current) {
      return;
    }

    const client = createStompClient(getStompBrokerURL());
    clientRef.current = client;
    setConnectionState({ client, connected: false });

    client.onConnect = () => {
      setConnectionState({ client, connected: true });
      forcedExitConsumedRef.current = false;
      userRoomsQueueUnsubRef.current?.();
      userRoomsQueueUnsubRef.current = subscribeUserRoomsQueue(client, {
        queryClientRef,
        getCurrentRoomId: () => currentRoomIdRef.current?.trim() ?? null,
        notifyForcedRoomExit,
      });

      const rid = currentRoomIdRef.current?.trim() ?? "";
      if (
        rid &&
        !pathDefersRoomStompRoomTopics(pathnameRef.current)
      ) {
        subscribeToRoomTopics(client, rid);
        invalidateRoomQueriesAfterStompReconnect(queryClientRef.current, rid);
      }
    };

    client.onDisconnect = () => {
      setConnectionState((prev) => ({ ...prev, connected: false }));
    };

    client.onStompError = () => {
      setConnectionState((prev) => ({ ...prev, connected: false }));
    };

    client.activate();

    return () => {
      teardownConnectedClient();
    };
  }, [
    notifyForcedRoomExit,
    stompEligible,
    subscribeToRoomTopics,
    teardownConnectedClient,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected) return;

    if (pathDefersRoomStompRoomTopics(pathname)) {
      detachRoomTopicsOnly();
      return;
    }

    if (currentRoomId) {
      subscribeToRoomTopics(client, currentRoomId);
    } else {
      unsubscribeRoomTopics();
    }
  }, [
    currentRoomId,
    detachRoomTopicsOnly,
    pathname,
    subscribeToRoomTopics,
    unsubscribeRoomTopics,
  ]);

  return (
    <StompContext.Provider
      value={{
        client: connectionState.client,
        connected: connectionState.connected,
        setRoomChatMessageHandler,
      }}
    >
      {children}
    </StompContext.Provider>
  );
}

export function useStompContext(): StompContextValue {
  return useContext(StompContext);
}
