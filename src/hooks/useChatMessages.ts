import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ServerChatMessage } from "@/types/chat";
import {
  deriveAiRequestConversationState,
  maxSequenceInMessages,
  mergeServerMessageLists,
  newestServerMessageByCreatedAt,
  normalizeFetchedRoomMessages,
  oldestServerMessageByCreatedAt,
  parseFiniteNumber,
  serverMessageToChatMessage,
  transientMessagesDuringRoomHistoryFetch,
} from "@/lib/chat";
import { useStompContext } from "@/contexts/StompContext";
import { useSessionUser } from "@/hooks/useSessionUser";
import { getRoomMessageReadStatus, getRoomMessages } from "@/lib/api/rooms";
import type { RoomMember } from "@/lib/api/rooms";
import { useRoomMembers } from "@/hooks/useRooms";
import { useChatActions } from "@/hooks/useChatActions";
import { useChatMessageRead } from "@/hooks/useChatMessageRead";
import { warmPlacePhotoQueriesFromChatHistory } from "@/lib/places/warmChatHistoryPlacePhotos";
import {
  hasOlderHistoryPage,
  loadInitialRoomHistory,
} from "@/lib/chat/initialRoomHistory";

export const CHAT_MESSAGE_PAGE_SIZE = 15;

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

function bumpRoomLastSequence(
  map: Map<string, number>,
  rid: string,
  msgs: readonly ServerChatMessage[],
) {
  const mx = maxSequenceInMessages(msgs);
  if (mx == null) return;
  const prev = map.get(rid);
  map.set(rid, prev != null ? Math.max(prev, mx) : mx);
}

export function useChatMessages(
  roomId: string | null,
  options: UseChatMessagesOptions,
) {
  const { fetchHistory } = options;
  const queryClient = useQueryClient();
  const { setRoomChatMessageHandler } = useStompContext();
  const { data: sessionUser } = useSessionUser();
  const userId = sessionUser?.id;
  const { data: membersData } = useRoomMembers(roomId);
  const [rawMessages, setRawMessages] = useState<ServerChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [isFetchingNewer, setIsFetchingNewer] = useState(false);
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
  /** 방별 마지막 수신 sequence — STOMP gap 감지용 */
  const lastSequenceByRoomRef = useRef<Map<string, number>>(new Map());
  /** afterSequence 복구 fetch 진행 중인 방 */
  const recoveringSequenceRoomsRef = useRef<Set<string>>(new Set());
  const isFetchingOlderRef = useRef(false);
  const isFetchingNewerRef = useRef(false);
  const rawMessagesRef = useRef<ServerChatMessage[]>([]);
  rawMessagesRef.current = rawMessages;

  const { markMessagesRead, resetReadDedup, onIncomingMessage } =
    useChatMessageRead({
      roomId,
      panelOpen: fetchHistory,
      rawMessagesRef,
    });

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
      lastSequenceByRoomRef.current.clear();
      recoveringSequenceRoomsRef.current.clear();
      setHasMore(true);
      setHasMoreNewer(false);
      setIsFetchingOlder(false);
      setIsFetchingNewer(false);
      isFetchingOlderRef.current = false;
      isFetchingNewerRef.current = false;
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

    if (userId == null) return;

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
        const { lastReadMessageId } = await getRoomMessageReadStatus(roomId);
        if (cancelled) return;

        const out = await loadInitialRoomHistory(
          roomId,
          lastReadMessageId,
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
        bumpRoomLastSequence(lastSequenceByRoomRef.current, roomId, out.serverSlice);
        historyFetchedRoomIdsRef.current.add(gateKey);
        void warmPlacePhotoQueriesFromChatHistory(queryClient, out.warmHistory);

        const caughtUpAtBottom =
          !out.initialScrollAnchorId && !out.hasMoreNewer;
        const newest = newestServerMessageByCreatedAt(out.serverSlice);
        if (caughtUpAtBottom && newest) {
          resetReadDedup();
          markMessagesRead(newest.id);
        }
      } catch {
        /* 실패 시 Set에 넣지 않음 → 다음 패널 오픈 시 재시도 */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    roomId,
    fetchHistory,
    queryClient,
    userId,
    markMessagesRead,
    resetReadDedup,
  ]);

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
        bumpRoomLastSequence(lastSequenceByRoomRef.current, rid, normalizedHistory);
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

  const fetchNewerMessages = useCallback(() => {
    const rid = roomId;
    if (!rid) return;
    if (isFetchingNewerRef.current) return;
    if (hasMoreNewerByRoomRef.current.get(rid) !== true) return;

    const newest = newestServerMessageByCreatedAt(rawMessagesRef.current);
    if (!newest) return;

    isFetchingNewerRef.current = true;
    setIsFetchingNewer(true);

    void getRoomMessages(rid, {
      afterId: newest.id,
      size: CHAT_MESSAGE_PAGE_SIZE,
    })
      .then((history) => {
        const normalizedHistory = normalizeFetchedRoomMessages(history);
        const more = hasOlderHistoryPage(
          normalizedHistory.length,
          CHAT_MESSAGE_PAGE_SIZE,
        );
        hasMoreNewerByRoomRef.current.set(rid, more);
        setHasMoreNewer(more);
        setRawMessages((prev) =>
          mergeServerMessageLists(prev, normalizedHistory),
        );
        bumpRoomLastSequence(lastSequenceByRoomRef.current, rid, normalizedHistory);
        void warmPlacePhotoQueriesFromChatHistory(
          queryClient,
          normalizedHistory,
        );
      })
      .catch(() => {
        /* 유지: hasMoreNewer 그대로, 다음 스크롤에서 재시도 가능 */
      })
      .finally(() => {
        isFetchingNewerRef.current = false;
        setIsFetchingNewer(false);
      });
  }, [roomId, queryClient]);

  const recoverMissingMessages = useCallback(
    (rid: string, afterSeq: number) => {
      if (recoveringSequenceRoomsRef.current.has(rid)) return;
      recoveringSequenceRoomsRef.current.add(rid);

      void getRoomMessages(rid, {
        afterSequence: String(afterSeq),
        size: CHAT_MESSAGE_PAGE_SIZE,
      })
        .then((rows) => {
          const normalized = normalizeFetchedRoomMessages(rows);
          setRawMessages((prev) => mergeServerMessageLists(prev, normalized));
          bumpRoomLastSequence(lastSequenceByRoomRef.current, rid, normalized);
          void warmPlacePhotoQueriesFromChatHistory(queryClient, normalized);
        })
        .catch(() => {
          /* 다음 STOMP 수신 시 재감지 */
        })
        .finally(() => {
          recoveringSequenceRoomsRef.current.delete(rid);
        });
    },
    [queryClient],
  );

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
        lastSequenceByRoomRef.current.delete(rid);
        setRawMessages([]);
        queueMicrotask(() => {
          setRawMessages(normalized);
          bumpRoomLastSequence(lastSequenceByRoomRef.current, rid, normalized);
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
      const rid = roomId.trim();
      const lastSeq = lastSequenceByRoomRef.current.get(rid);
      const seq = msg.sequence;
      const isNew = !rawMessagesRef.current.some((m) => m.id === msg.id);

      setRawMessages((prev) => {
        const i = prev.findIndex((m) => m.id === msg.id);
        if (i < 0) return [...prev, msg];
        const next = [...prev];
        next[i] = msg;
        return next;
      });

      const atTail = hasMoreNewerByRoomRef.current.get(rid) !== true;
      if (
        atTail &&
        seq != null &&
        lastSeq != null &&
        seq > lastSeq + 1 &&
        !recoveringSequenceRoomsRef.current.has(rid)
      ) {
        recoverMissingMessages(rid, lastSeq);
      }

      if (seq != null) {
        lastSequenceByRoomRef.current.set(
          rid,
          Math.max(lastSeq ?? seq, seq),
        );
      }

      onIncomingMessage(msg, isNew);
    };
    setRoomChatMessageHandler(handler);
    return () => setRoomChatMessageHandler(null);
  }, [roomId, setRoomChatMessageHandler, onIncomingMessage, recoverMissingMessages]);

  return {
    messages,
    sendChatMessage,
    sendAiMessage,
    sendCancelAiRequest,
    fetchOlderMessages,
    fetchNewerMessages,
    jumpToLatest,
    hasMore,
    hasMoreNewer,
    isFetchingOlder,
    isFetchingNewer,
    initialScrollAnchorId,
    markMessagesRead,
  };
}
