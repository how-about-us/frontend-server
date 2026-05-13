"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import type { Client } from "@stomp/stompjs";
import { toast } from "sonner";

import {
  pathDefersRoomStompRoomTopics,
  pathSuspendsStomp,
} from "@/lib/stomp/stompPathPolicy";
import { subscribeRoomStompTopics } from "@/lib/stomp/subscribe-room-topics";
import type { ForcedRoomExitReason } from "@/lib/stomp/user-room-queue";
import { ROOMS_QUERY_KEY } from "@/lib/query-keys";
import { useSessionStore } from "@/stores/session-store";
import { useChatUnreadStore } from "@/stores/chat-unread-store";
import type { ServerChatMessage } from "@/types/chat";

import {
  useStompClientLifecycleEffect,
  useStompRoomTopicsResyncEffect,
  type StompConnectionState,
} from "./use-stomp-provider-effects";

export type StompContextValue = StompConnectionState & {
  setRoomChatMessageHandler: (
    fn: ((msg: ServerChatMessage) => void) | null,
  ) => void;
};

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
  /** pathname-only 재구독과 실제 방 전환을 구분해 `chatCnt`를 불필요하게 리셋하지 않음 */
  const lastSubscribedRoomIdRef = useRef<string | null>(null);
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
    lastSubscribedRoomIdRef.current = null;
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

      void queryClientRef.current.invalidateQueries({
        queryKey: ROOMS_QUERY_KEY,
      });

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
      if (lastSubscribedRoomIdRef.current !== rid) {
        useChatUnreadStore.getState().resetChatCnt();
      }
      lastSubscribedRoomIdRef.current = rid;
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

  const stompEligible = Boolean(user && !pathSuspendsStomp(pathname));

  useStompClientLifecycleEffect({
    stompEligible,
    notifyForcedRoomExit,
    subscribeToRoomTopics,
    teardownConnectedClient,
    clientRef,
    userRoomsQueueUnsubRef,
    currentRoomIdRef,
    pathnameRef,
    forcedExitConsumedRef,
    queryClientRef,
    setConnectionState,
  });

  useStompRoomTopicsResyncEffect({
    pathname,
    currentRoomId,
    clientRef,
    detachRoomTopicsOnly,
    subscribeToRoomTopics,
    unsubscribeRoomTopics,
  });

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
