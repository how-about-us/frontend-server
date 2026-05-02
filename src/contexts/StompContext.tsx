"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Client, StompSubscription } from "@stomp/stompjs";

import {
  buildBookmarkBroadcastMessage,
  type RoomBookmarkChangedEvent,
  RoomBroadcastBookmarkIcon,
  resolveActorPresence,
  roomPresenceToastIcon,
  showRoomBroadcastAlert,
} from "@/components/stomp/RoomBroadcastAlert";
import { createStompClient, getStompBrokerURL } from "@/lib/stomp/client";
import { invalidateRoomBookmarkQueries } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";

interface RoomPresenceChangedEvent {
  nickname: string | null;
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

export function StompProvider({ children }: { children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const clientRef = useRef<Client | null>(null);
  const presenceSubRef = useRef<StompSubscription | null>(null);
  const bookmarksSubRef = useRef<StompSubscription | null>(null);
  const [contextValue, setContextValue] = useState<StompContextValue>({
    client: null,
    connected: false,
  });

  const unsubscribeRoomTopics = () => {
    presenceSubRef.current?.unsubscribe();
    presenceSubRef.current = null;
    bookmarksSubRef.current?.unsubscribe();
    bookmarksSubRef.current = null;
  };

  const subscribeToRoomTopics = (client: Client, roomId: string) => {
    unsubscribeRoomTopics();

    presenceSubRef.current = client.subscribe(
      `/topic/rooms/${roomId}/presence`,
      (message) => {
        void (async () => {
          try {
            const event = JSON.parse(message.body) as RoomPresenceChangedEvent;

            const trimmed =
              typeof event.nickname === "string"
                ? event.nickname.trim()
                : "";

            const payloadImgRaw = event.profileImageUrl;
            const payloadImg =
              typeof payloadImgRaw === "string" &&
              payloadImgRaw.trim().length > 0
                ? payloadImgRaw.trim()
                : null;

            const uid =
              typeof event.userId === "number" && Number.isFinite(event.userId)
                ? event.userId
                : Number(event.userId);

            let displayName = trimmed;
            let profileUrl: string | null = payloadImg;

            if (!displayName || profileUrl === null) {
              const fromMembers = await resolveActorPresence(
                queryClientRef.current,
                roomId,
                Number.isFinite(uid) ? uid : 0,
              );
              if (!displayName) displayName = fromMembers.nickname;
              if (profileUrl === null)
                profileUrl = fromMembers.profileImageUrl ?? null;
            }

            const icon = roomPresenceToastIcon(profileUrl);

            if (event.type === "USER_CONNECTED") {
              showRoomBroadcastAlert({
                message: `${displayName}님이 입장했습니다`,
                icon,
              });
            } else if (event.type === "USER_DISCONNECTED") {
              showRoomBroadcastAlert({
                message: `${displayName}님이 퇴장했습니다`,
                icon,
              });
            }
          } catch {
            // malformed message — ignore
          }
        })();
      },
    );

    bookmarksSubRef.current = client.subscribe(
      `/topic/rooms/${roomId}/bookmarks`,
      (message) => {
        void (async () => {
          try {
            const event: RoomBookmarkChangedEvent = JSON.parse(message.body);
            const rid = String(event.roomId ?? "").trim();
            if (!rid) return;

            const msg = await buildBookmarkBroadcastMessage(
              queryClientRef.current,
              event,
            );
            await invalidateRoomBookmarkQueries(queryClientRef.current, rid);
            showRoomBroadcastAlert({
              message: msg,
              icon: <RoomBroadcastBookmarkIcon />,
            });
          } catch {
            // malformed message / network — ignore
          }
        })();
      },
    );
  };

  // STOMP 클라이언트 생성 및 연결 — user 로그인 여부에 따라 activate/deactivate
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
      if (currentRoomId) {
        subscribeToRoomTopics(client, currentRoomId);
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
    // currentRoomId는 별도 effect에서 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // roomId 변경 시 구독 대상 교체
  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected) return;

    if (currentRoomId) {
      subscribeToRoomTopics(client, currentRoomId);
    } else {
      unsubscribeRoomTopics();
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
