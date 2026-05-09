"use client";

import type { MutableRefObject } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { Client } from "@stomp/stompjs";

import { createStompClient, getStompBrokerURL } from "@/lib/stomp/client";
import { invalidateRoomQueriesAfterStompReconnect } from "@/lib/stomp/invalidateRoomQueriesAfterStompReconnect";
import { pathDefersRoomStompRoomTopics } from "@/lib/stomp/stompPathPolicy";
import { subscribeUserRoomsQueue } from "@/lib/stomp/subscribe-user-rooms-queue";
import type { ForcedRoomExitReason } from "@/lib/stomp/user-room-queue";

export type StompConnectionState = {
  client: Client | null;
  connected: boolean;
};

type LifecycleOpts = {
  stompEligible: boolean;
  notifyForcedRoomExit: (
    reason: ForcedRoomExitReason,
    eventRoomId: string,
  ) => void;
  subscribeToRoomTopics: (client: Client, roomId: string) => void;
  teardownConnectedClient: () => void;
  clientRef: MutableRefObject<Client | null>;
  userRoomsQueueUnsubRef: MutableRefObject<(() => void) | null>;
  currentRoomIdRef: MutableRefObject<string | null>;
  pathnameRef: MutableRefObject<string>;
  forcedExitConsumedRef: MutableRefObject<boolean>;
  queryClientRef: MutableRefObject<QueryClient>;
  setConnectionState: Dispatch<SetStateAction<StompConnectionState>>;
};

/**
 * 로그인·경로 조건으로 STOMP 클라이언트 1개를 유지하고, 재연결 시 유저 방 큐 구독을 세팅합니다.
 */
export function useStompClientLifecycleEffect({
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
}: LifecycleOpts): void {
  /* eslint-disable react-hooks/set-state-in-effect -- STOMP connect 시 컨텍스트와 상태 동기화 */
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
      if (rid && !pathDefersRoomStompRoomTopics(pathnameRef.current)) {
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
}

type RoomTopicsOpts = {
  pathname: string;
  currentRoomId: string | null;
  clientRef: MutableRefObject<Client | null>;
  detachRoomTopicsOnly: () => void;
  subscribeToRoomTopics: (client: Client, roomId: string) => void;
  unsubscribeRoomTopics: () => void;
};

/** 방·경로 변경 시 방 토픽 구독을 맞춥니다 (`pathDefersRoomStompRoomTopics` 포함). */
export function useStompRoomTopicsResyncEffect({
  pathname,
  currentRoomId,
  clientRef,
  detachRoomTopicsOnly,
  subscribeToRoomTopics,
  unsubscribeRoomTopics,
}: RoomTopicsOpts): void {
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
}
