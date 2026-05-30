"use client";

import type { MutableRefObject } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { Client } from "@stomp/stompjs";

import { createStompClient, getStompBrokerURL } from "@/lib/stomp/client";
import { pathDefersRoomStompRoomTopics } from "@/lib/stomp/stompPathPolicy";
import {
  handleStompSessionExpired,
  renewSessionAfterStompClose,
  STOMP_ACCESS_TOKEN_EXPIRED_CLOSE_CODE,
} from "@/lib/stomp/stomp-session-recovery";
import { startSessionPresencePing } from "@/lib/stomp/sessionPresencePing";
import { subscribeUserRoomsQueue } from "@/lib/stomp/subscribe-user-rooms-queue";
import type { ForcedRoomExitReason } from "@/lib/stomp/user-room-queue";

export type StompConnectionState = {
  client: Client | null;
  connected: boolean;
};

type LifecycleOpts = {
  stompEligible: boolean;
  stompConnectNonce: number;
  suppressCloseRecoveryRef: MutableRefObject<boolean>;
  notifyForcedRoomExit: (
    reason: ForcedRoomExitReason,
    eventRoomId: string,
    message?: string,
  ) => void;
  subscribeToRoomTopics: (client: Client, roomId: string) => void;
  teardownConnectedClient: () => void;
  onRequestStompReconnect: () => void;
  clientRef: MutableRefObject<Client | null>;
  userRoomsQueueUnsubRef: MutableRefObject<(() => void) | null>;
  getResolvedRoomId: () => string | null;
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
  stompConnectNonce,
  suppressCloseRecoveryRef,
  notifyForcedRoomExit,
  subscribeToRoomTopics,
  teardownConnectedClient,
  onRequestStompReconnect,
  clientRef,
  userRoomsQueueUnsubRef,
  getResolvedRoomId,
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

    suppressCloseRecoveryRef.current = false;

    const stopPingRef: { current: (() => void) | null } = { current: null };
    const recoveryInFlightRef = { current: false };
    let effectActive = true;

    const stopAppPing = () => {
      stopPingRef.current?.();
      stopPingRef.current = null;
    };

    const client = createStompClient(getStompBrokerURL());
    clientRef.current = client;
    setConnectionState({ client, connected: false });

    client.onConnect = () => {
      if (!effectActive) return;
      setConnectionState({ client, connected: true });
      forcedExitConsumedRef.current = false;

      stopAppPing();
      stopPingRef.current = startSessionPresencePing(client);

      userRoomsQueueUnsubRef.current?.();
      userRoomsQueueUnsubRef.current = subscribeUserRoomsQueue(client, {
        queryClientRef,
        notifyForcedRoomExit,
      });

      const rid = getResolvedRoomId();
      if (rid && !pathDefersRoomStompRoomTopics(pathnameRef.current)) {
        subscribeToRoomTopics(client, rid);
      }
    };

    client.onDisconnect = () => {
      if (!effectActive) return;
      setConnectionState((prev) => ({ ...prev, connected: false }));
    };

    client.onStompError = () => {
      if (!effectActive) return;
      setConnectionState((prev) => ({ ...prev, connected: false }));
    };

    client.onWebSocketClose = (event) => {
      if (!effectActive) return;
      if (suppressCloseRecoveryRef.current) return;
      if (recoveryInFlightRef.current) return;

      if (event.code === STOMP_ACCESS_TOKEN_EXPIRED_CLOSE_CODE) {
        console.debug("[stomp] WebSocket closed: ACCESS_TOKEN_EXPIRED (4001)");
      }

      recoveryInFlightRef.current = true;
      stopAppPing();
      setConnectionState((prev) => ({ ...prev, connected: false }));

      void (async () => {
        try {
          const result = await renewSessionAfterStompClose(
            queryClientRef.current,
          );
          if (!effectActive || suppressCloseRecoveryRef.current) return;

          if (!result.ok) {
            handleStompSessionExpired(queryClientRef.current);
            return;
          }

          suppressCloseRecoveryRef.current = true;
          userRoomsQueueUnsubRef.current?.();
          userRoomsQueueUnsubRef.current = null;
          client.deactivate();
          clientRef.current = null;
          suppressCloseRecoveryRef.current = false;

          if (!effectActive) return;
          onRequestStompReconnect();
        } finally {
          recoveryInFlightRef.current = false;
        }
      })();
    };

    client.activate();

    return () => {
      effectActive = false;
      stopAppPing();
      teardownConnectedClient();
    };
  }, [
    getResolvedRoomId,
    notifyForcedRoomExit,
    onRequestStompReconnect,
    stompConnectNonce,
    stompEligible,
    subscribeToRoomTopics,
    suppressCloseRecoveryRef,
    teardownConnectedClient,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */
}

type RoomTopicsOpts = {
  pathname: string;
  resolvedRoomId: string | null;
  connected: boolean;
  clientRef: MutableRefObject<Client | null>;
  detachRoomTopicsOnly: () => void;
  subscribeToRoomTopics: (client: Client, roomId: string) => void;
  unsubscribeRoomTopics: () => void;
};

/** 방·경로 변경 시 방 토픽 구독을 맞춥니다 (`pathDefersRoomStompRoomTopics` 포함). */
export function useStompRoomTopicsResyncEffect({
  pathname,
  resolvedRoomId,
  connected,
  clientRef,
  detachRoomTopicsOnly,
  subscribeToRoomTopics,
  unsubscribeRoomTopics,
}: RoomTopicsOpts): void {
  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected || !connected) return;

    if (pathDefersRoomStompRoomTopics(pathname)) {
      detachRoomTopicsOnly();
      return;
    }

    if (resolvedRoomId) {
      subscribeToRoomTopics(client, resolvedRoomId);
    } else {
      unsubscribeRoomTopics();
    }
  }, [
    connected,
    resolvedRoomId,
    detachRoomTopicsOnly,
    pathname,
    subscribeToRoomTopics,
    unsubscribeRoomTopics,
  ]);
}
