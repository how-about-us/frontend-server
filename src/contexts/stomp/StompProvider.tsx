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

import {
  evictRoomFromClientCaches,
  refreshRoomsList,
  showForcedExitToast,
} from "@/lib/stomp/forced-room-exit-dispatch";
import {
  pathDefersRoomStompRoomTopics,
  pathSuspendsStomp,
} from "@/lib/stomp/stompPathPolicy";
import { subscribeRoomStompTopics } from "@/lib/stomp/subscribe-room-topics";
import type { ForcedRoomExitReason } from "@/lib/stomp/user-room-queue";
import { resolveRoomIdFromPathname } from "@/lib/session-room-storage";
import { useSessionUser } from "@/hooks/useSessionUser";
import {
  bootstrapCurrentRoomFromSessionStorage,
  useSessionStore,
} from "@/stores/session-store";
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

export function StompProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useSessionUser();
  const storeRoomId = useSessionStore((s) => s.currentRoomId);
  const resolvedRoomId = resolveRoomIdFromPathname(storeRoomId, pathname);
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);

  useLayoutEffect(() => {
    bootstrapCurrentRoomFromSessionStorage();
  }, []);

  useLayoutEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  const getResolvedRoomId = useCallback((): string | null => {
    return resolveRoomIdFromPathname(
      useSessionStore.getState().currentRoomId,
      pathnameRef.current,
    );
  }, []);

  const pathnameRef = useRef(pathname);
  useLayoutEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const clientRef = useRef<Client | null>(null);
  const roomTopicsUnsubRef = useRef<(() => void) | null>(null);
  const userRoomsQueueUnsubRef = useRef<(() => void) | null>(null);
  /** pathname-only 재구독과 실제 방 전환을 구분 */
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
  }, [detachRoomTopicsOnly]);

  const handleForcedRoomExit = useCallback(() => {
    unsubscribeRoomTopics();

    const session = useSessionStore.getState();
    session.clearCurrentRoomId();

    router.replace("/home");
  }, [router, unsubscribeRoomTopics]);

  const notifyForcedRoomExit = useCallback(
    (reason: ForcedRoomExitReason, eventRoomId: string, message?: string) => {
      const rid = eventRoomId.trim();
      if (!rid) return;

      evictRoomFromClientCaches(queryClientRef.current, rid);
      refreshRoomsList(queryClientRef.current);
      showForcedExitToast(reason, message);

      const cur = getResolvedRoomId()?.trim() ?? "";
      if (cur === rid) {
        if (forcedExitConsumedRef.current) return;
        forcedExitConsumedRef.current = true;
        handleForcedRoomExit();
        return;
      }

      const stored = useSessionStore.getState().currentRoomId?.trim() ?? "";
      if (stored === rid) {
        useSessionStore.getState().clearCurrentRoomId();
      }
    },
    [getResolvedRoomId, handleForcedRoomExit],
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
        lastSubscribedRoomIdRef.current = rid;
      }
      detachRoomTopicsOnly();
      forcedExitConsumedRef.current = false;
      roomTopicsUnsubRef.current = subscribeRoomStompTopics(
        client,
        rid,
        queryClientRef,
        { onRoomChatMessage },
      );
    },
    [detachRoomTopicsOnly, onRoomChatMessage],
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
    getResolvedRoomId,
    pathnameRef,
    forcedExitConsumedRef,
    queryClientRef,
    setConnectionState,
  });

  useStompRoomTopicsResyncEffect({
    pathname,
    resolvedRoomId,
    connected: connectionState.connected,
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
