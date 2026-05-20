import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ServerChatMessage } from "@/types/chat";
import {
  deriveAiRequestConversationState,
  mergeServerMessageLists,
  newestServerMessageByCreatedAt,
  normalizeFetchedRoomMessages,
  oldestServerMessageByCreatedAt,
  parseFiniteNumber,
  serverMessageToChatMessage,
  transientMessagesDuringRoomHistoryFetch,
} from "@/lib/chat";
import { useStompContext } from "@/contexts/StompContext";
import { useSessionStore } from "@/stores/session-store";
import { getRoomMessages } from "@/lib/api/rooms";
import type { RoomMember } from "@/lib/api/rooms";
import { useRoomMembers } from "@/hooks/useRooms";
import { useChatActions } from "@/hooks/useChatActions";
import { warmPlacePhotoQueriesFromChatHistory } from "@/lib/places/warmChatHistoryPlacePhotos";
import { roomUnreadCountQueryKey } from "@/lib/query-keys";
import {
  hasOlderHistoryPage,
  loadInitialRoomHistory,
} from "@/lib/chat/initialRoomHistory";

export const CHAT_MESSAGE_PAGE_SIZE = 30;

export type UseChatMessagesOptions = {
  /**
   * `false`: 패널 닫힘 — GET 없음. STOMP만 유지.
   * `true`: 이 `roomId`에 대해 **이번 페이지 수명 내 아직 GET을 한 적 없을 때만** 히스토리 GET.
   * (닫았다 다시 열 때는 같은 방이면 재요청 안 함.)
   */
  fetchHistory: boolean;
};

/** 히스토리 GET 1회 가드 — userId가 나중에 채워지면 afterId 경로로 다시 가져갈 수 있게 분리 */
function chatHistoryGateKey(
  uid: number | null | undefined,
  roomId: string,
): string {
  return `${uid ?? "anon"}:${roomId.trim()}`;
}

export function useChatMessages(
  roomId: string | null,
  options: UseChatMessagesOptions,
) {
  const { fetchHistory } = options;
  const queryClient = useQueryClient();
  const { client, connected, setRoomChatMessageHandler } = useStompContext();
  const userId = useSessionStore((s) => s.user?.id);
  const { data: membersData } = useRoomMembers(roomId);
  const [rawMessages, setRawMessages] = useState<ServerChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [hasMoreNewer, setHasMoreNewer] = useState(false);
  const [initialScrollAnchorId, setInitialScrollAnchorId] = useState<
    string | undefined
  >(undefined);
  const { sendChatMessage, sendAiMessage, sendCancelAiRequest } =
    useChatActions();

  const prevRoomForHistoryGateRef = useRef<string | null>(null);
  /** 같은 탭·새로고침 전까지 `roomId`별 히스토리 GET 1회만 */
  const historyFetchedRoomIdsRef = useRef<Set<string>>(new Set());
  /** 방별 과거 메시지 추가 로드 가능 여부 */
  const hasMoreByRoomRef = useRef<Map<string, boolean>>(new Map());
  /** 방별 after 이후 더 불러올 메시지 존재 여부 */
  const hasMoreNewerByRoomRef = useRef<Map<string, boolean>>(new Map());
  const isFetchingOlderRef = useRef(false);
  const rawMessagesRef = useRef<ServerChatMessage[]>([]);
  const lastPublishedReadIdRef = useRef<string | null>(null);
  rawMessagesRef.current = rawMessages;

  const markMessagesRead = useCallback(
    (messageId?: string) => {
      const rid = roomId?.trim();
      if (!rid || !client || !connected) return;

      const id =
        messageId?.trim() ||
        newestServerMessageByCreatedAt(rawMessagesRef.current)?.id;
      if (!id || id === lastPublishedReadIdRef.current) return;

      lastPublishedReadIdRef.current = id;
      client.publish({
        destination: `/app/rooms/${rid}/messages/read`,
        body: JSON.stringify({ lastReadMessageId: id }),
      });
      void queryClient.invalidateQueries({
        queryKey: roomUnreadCountQueryKey(rid),
      });
    },
    [client, connected, roomId, queryClient],
  );

  const memberMap = useMemo(() => {
    const members = membersData?.members;
    if (!members?.length) {
      return new Map<
        number,
        Pick<RoomMember, "nickname" | "profileImageUrl">
      >();
    }
    return new Map(
      members.map((m) => {
        const uid = parseFiniteNumber(m.userId) ?? m.userId;
        return [
          uid,
          { nickname: m.nickname, profileImageUrl: m.profileImageUrl },
        ] as const;
      }),
    );
  }, [membersData?.members]);

  const { fulfilledAiRequestIds, aiRequestReplyLookup } = useMemo(
    () => deriveAiRequestConversationState(rawMessages),
    [rawMessages],
  );

  const roomMembersResolved = Boolean(membersData);

  const messages = useMemo(
    () =>
      rawMessages.map((m) =>
        serverMessageToChatMessage(
          m,
          userId,
          memberMap,
          fulfilledAiRequestIds,
          aiRequestReplyLookup,
          roomMembersResolved,
        ),
      ),
    [
      rawMessages,
      userId,
      memberMap,
      fulfilledAiRequestIds,
      aiRequestReplyLookup,
      roomMembersResolved,
    ],
  );

  useEffect(() => {
    if (!roomId) {
      setRawMessages([]);
      setInitialScrollAnchorId(undefined);
      prevRoomForHistoryGateRef.current = null;
      historyFetchedRoomIdsRef.current.clear();
      hasMoreByRoomRef.current.clear();
      hasMoreNewerByRoomRef.current.clear();
      setHasMore(true);
      setHasMoreNewer(false);
      setIsFetchingOlder(false);
      isFetchingOlderRef.current = false;
      lastPublishedReadIdRef.current = null;
      return;
    }

    if (!fetchHistory) {
      const prevR = prevRoomForHistoryGateRef.current;
      if (prevR !== null && prevR !== roomId) {
        setRawMessages([]);
        setInitialScrollAnchorId(undefined);
        setHasMore(true);
        setHasMoreNewer(false);
      }
      prevRoomForHistoryGateRef.current = roomId;
      return;
    }

    prevRoomForHistoryGateRef.current = roomId;

    const gateKey = chatHistoryGateKey(userId, roomId);

    if (historyFetchedRoomIdsRef.current.has(gateKey)) {
      const hm = hasMoreByRoomRef.current.get(roomId);
      setHasMore(hm !== false);
      const hmn = hasMoreNewerByRoomRef.current.get(roomId);
      setHasMoreNewer(hmn === true);
      setInitialScrollAnchorId(undefined);
      return;
    }

    setRawMessages([]);
    setHasMore(true);
    setHasMoreNewer(false);
    setInitialScrollAnchorId(undefined);
    let cancelled = false;

    void (async () => {
      try {
        const out = await loadInitialRoomHistory(
          roomId,
          null,
          CHAT_MESSAGE_PAGE_SIZE,
        );
        if (cancelled) return;

        hasMoreByRoomRef.current.set(roomId, out.hasMoreOlder);
        hasMoreNewerByRoomRef.current.set(roomId, out.hasMoreNewer);
        setHasMore(out.hasMoreOlder);
        setHasMoreNewer(out.hasMoreNewer);
        setInitialScrollAnchorId(out.initialScrollAnchorId);
        setRawMessages((prev) =>
          mergeServerMessageLists(
            out.serverSlice,
            transientMessagesDuringRoomHistoryFetch(prev),
          ),
        );
        historyFetchedRoomIdsRef.current.add(gateKey);
        void warmPlacePhotoQueriesFromChatHistory(queryClient, out.warmHistory);

        const newest = newestServerMessageByCreatedAt(out.serverSlice);
        if (newest) {
          lastPublishedReadIdRef.current = null;
          markMessagesRead(newest.id);
        }
      } catch {
        /* 실패 시 Set에 넣지 않음 → 다음 패널 오픈 시 재시도 */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, fetchHistory, queryClient, userId, markMessagesRead]);

  const fetchOlderMessages = useCallback(() => {
    const rid = roomId;
    if (!rid) return;
    if (isFetchingOlderRef.current) return;
    if (hasMoreByRoomRef.current.get(rid) === false) return;

    const oldest = oldestServerMessageByCreatedAt(rawMessagesRef.current);
    if (!oldest) return;

    isFetchingOlderRef.current = true;
    setIsFetchingOlder(true);

    void getRoomMessages(rid, {
      beforeId: oldest.id,
      size: CHAT_MESSAGE_PAGE_SIZE,
    })
      .then((history) => {
        const normalizedHistory = normalizeFetchedRoomMessages(history);
        const more = hasOlderHistoryPage(
          normalizedHistory.length,
          CHAT_MESSAGE_PAGE_SIZE,
        );
        hasMoreByRoomRef.current.set(rid, more);
        setHasMore(more);
        setRawMessages((prev) =>
          mergeServerMessageLists(normalizedHistory, prev),
        );
        void warmPlacePhotoQueriesFromChatHistory(
          queryClient,
          normalizedHistory,
        );
      })
      .catch(() => {
        /* 유지: hasMore 그대로, 다음 스크롤에서 재시도 가능 */
      })
      .finally(() => {
        isFetchingOlderRef.current = false;
        setIsFetchingOlder(false);
      });
  }, [roomId, queryClient]);

  const jumpToLatest = useCallback(() => {
    const rid = roomId;
    if (!rid) return;

    void getRoomMessages(rid, { size: CHAT_MESSAGE_PAGE_SIZE })
      .then((history) => {
        const normalized = normalizeFetchedRoomMessages(history);
        const more = hasOlderHistoryPage(
          normalized.length,
          CHAT_MESSAGE_PAGE_SIZE,
        );
        hasMoreByRoomRef.current.set(rid, more);
        hasMoreNewerByRoomRef.current.set(rid, false);
        setInitialScrollAnchorId(undefined);
        setHasMore(more);
        setHasMoreNewer(false);
        setRawMessages([]);
        queueMicrotask(() => {
          setRawMessages(normalized);
          void warmPlacePhotoQueriesFromChatHistory(queryClient, normalized);
        });
      })
      .catch(() => {
        /* noop */
      });
  }, [roomId, queryClient]);

  useEffect(() => {
    if (!roomId) {
      setRoomChatMessageHandler(null);
      return;
    }

    const handler = (msg: ServerChatMessage) => {
      setRawMessages((prev) => {
        const i = prev.findIndex((m) => m.id === msg.id);
        if (i < 0) return [...prev, msg];
        const next = [...prev];
        next[i] = msg;
        return next;
      });
    };
    setRoomChatMessageHandler(handler);
    return () => setRoomChatMessageHandler(null);
  }, [roomId, setRoomChatMessageHandler]);

  return {
    messages,
    sendChatMessage,
    sendAiMessage,
    sendCancelAiRequest,
    fetchOlderMessages,
    jumpToLatest,
    hasMore,
    hasMoreNewer,
    isFetchingOlder,
    initialScrollAnchorId,
    markMessagesRead,
  };
}
