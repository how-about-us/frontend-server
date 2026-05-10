import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ServerChatMessage } from "@/types/chat";
import {
  deriveAiRequestConversationState,
  mergeServerMessageLists,
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

export const CHAT_MESSAGE_PAGE_SIZE = 30;

export type UseChatMessagesOptions = {
  /**
   * `false`: 패널 닫힘 — GET 없음. STOMP만 유지.
   * `true`: 이 `roomId`에 대해 **이번 페이지 수명 내 아직 GET을 한 적 없을 때만** 히스토리 GET.
   * (닫았다 다시 열 때는 같은 방이면 재요청 안 함.)
   */
  fetchHistory: boolean;
};

function hasOlderHistoryPage(
  fetchedLength: number,
  pageSize: number,
): boolean {
  return fetchedLength >= pageSize;
}

export function useChatMessages(
  roomId: string | null,
  options: UseChatMessagesOptions,
) {
  const { fetchHistory } = options;
  const queryClient = useQueryClient();
  const { setRoomChatMessageHandler } = useStompContext();
  const userId = useSessionStore((s) => s.user?.id);
  const { data: membersData } = useRoomMembers(roomId);
  const [rawMessages, setRawMessages] = useState<ServerChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const { sendChatMessage, sendAiMessage, sendCancelAiRequest } =
    useChatActions();

  const prevRoomForHistoryGateRef = useRef<string | null>(null);
  /** 같은 탭·새로고침 전까지 `roomId`별 히스토리 GET 1회만 */
  const historyFetchedRoomIdsRef = useRef<Set<string>>(new Set());
  /** 방별 과거 메시지 추가 로드 가능 여부 */
  const hasMoreByRoomRef = useRef<Map<string, boolean>>(new Map());
  const isFetchingOlderRef = useRef(false);
  const rawMessagesRef = useRef<ServerChatMessage[]>([]);
  rawMessagesRef.current = rawMessages;

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

  const messages = useMemo(
    () =>
      rawMessages.map((m) =>
        serverMessageToChatMessage(
          m,
          userId,
          memberMap,
          fulfilledAiRequestIds,
          aiRequestReplyLookup,
        ),
      ),
    [
      rawMessages,
      userId,
      memberMap,
      fulfilledAiRequestIds,
      aiRequestReplyLookup,
    ],
  );

  useEffect(() => {
    if (!roomId) {
      setRawMessages([]);
      prevRoomForHistoryGateRef.current = null;
      historyFetchedRoomIdsRef.current.clear();
      hasMoreByRoomRef.current.clear();
      setHasMore(true);
      setIsFetchingOlder(false);
      isFetchingOlderRef.current = false;
      return;
    }

    if (!fetchHistory) {
      const prevR = prevRoomForHistoryGateRef.current;
      if (prevR !== null && prevR !== roomId) {
        setRawMessages([]);
        setHasMore(true);
      }
      prevRoomForHistoryGateRef.current = roomId;
      return;
    }

    prevRoomForHistoryGateRef.current = roomId;

    if (historyFetchedRoomIdsRef.current.has(roomId)) {
      const hm = hasMoreByRoomRef.current.get(roomId);
      setHasMore(hm !== false);
      return;
    }

    setRawMessages([]);
    setHasMore(true);
    let cancelled = false;

    getRoomMessages(roomId, { size: CHAT_MESSAGE_PAGE_SIZE })
      .then((history) => {
        if (cancelled) return;
        const normalizedHistory = normalizeFetchedRoomMessages(history);
        const more = hasOlderHistoryPage(
          normalizedHistory.length,
          CHAT_MESSAGE_PAGE_SIZE,
        );
        hasMoreByRoomRef.current.set(roomId, more);
        setHasMore(more);
        setRawMessages((prev) =>
          mergeServerMessageLists(
            normalizedHistory,
            transientMessagesDuringRoomHistoryFetch(prev),
          ),
        );
        historyFetchedRoomIdsRef.current.add(roomId);
        void warmPlacePhotoQueriesFromChatHistory(queryClient, normalizedHistory);
      })
      .catch(() => {
        /* 실패 시 Set에 넣지 않음 → 다음 패널 오픈 시 재시도 */
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, fetchHistory, queryClient]);

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
        void warmPlacePhotoQueriesFromChatHistory(queryClient, normalizedHistory);
      })
      .catch(() => {
        /* 유지: hasMore 그대로, 다음 스크롤에서 재시도 가능 */
      })
      .finally(() => {
        isFetchingOlderRef.current = false;
        setIsFetchingOlder(false);
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
    hasMore,
    isFetchingOlder,
  };
}
