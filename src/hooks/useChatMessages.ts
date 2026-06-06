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
import {
  CHAT_MESSAGE_PAGE_SIZE,
  EMPTY_READ_DIVIDER_PLACEMENT,
  mergeSliceWithReadBridge,
  resolveReadDividerPlacement,
  type ChatScrollAnchorRequest,
  type ReadDividerPlacement,
} from "@/lib/chat/readBoundary";

export type UseChatMessagesOptions = {
  /**
   * `false`: 패널 닫힘 — GET 없음. STOMP만 유지.
   * `true`: 이 `roomId`에 대해 **이번 페이지 수명 내 아직 GET을 한 적 없을 때만** 히스토리 GET.
   * (닫았다 다시 열 때는 같은 방이면 히스토리 GET 없이 read-status로 마커·스크롤만 복원.)
   */
  fetchHistory: boolean;
};

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

function applyBridgedSlice(
  roomId: string,
  bridged: Awaited<ReturnType<typeof mergeSliceWithReadBridge>>,
  refs: {
    hasMoreNewerByRoom: Map<string, boolean>;
    lastSequenceByRoom: Map<string, number>;
  },
  setters: {
    setHasMoreNewer: (v: boolean) => void;
    setRawMessages: (msgs: ServerChatMessage[]) => void;
  },
  queryClient: ReturnType<typeof useQueryClient>,
) {
  if (bridged.bridgedHasMoreNewer == null) return;

  refs.hasMoreNewerByRoom.set(roomId, bridged.bridgedHasMoreNewer);
  setters.setHasMoreNewer(bridged.bridgedHasMoreNewer);
  setters.setRawMessages(bridged.slice);

  if (bridged.bridgedSlice?.length) {
    bumpRoomLastSequence(
      refs.lastSequenceByRoom,
      roomId,
      bridged.bridgedSlice,
    );
    void warmPlacePhotoQueriesFromChatHistory(queryClient, bridged.bridgedSlice);
  }
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
  const [readMarkerMessageId, setReadMarkerMessageId] = useState<
    string | null
  >(null);
  const [readDividerPlacement, setReadDividerPlacement] =
    useState<ReadDividerPlacement>(EMPTY_READ_DIVIDER_PLACEMENT);
  const [scrollToAnchor, setScrollToAnchor] =
    useState<ChatScrollAnchorRequest | null>(null);
  const { sendChatMessage, sendAiMessage, sendCancelAiRequest } =
    useChatActions();

  const prevRoomForHistoryGateRef = useRef<string | null>(null);
  const prevFetchHistoryRef = useRef(false);
  const reopenScrollKeyRef = useRef(0);
  const historyFetchedRoomIdsRef = useRef<Set<string>>(new Set());
  const hasMoreByRoomRef = useRef<Map<string, boolean>>(new Map());
  const hasMoreNewerByRoomRef = useRef<Map<string, boolean>>(new Map());
  const lastSequenceByRoomRef = useRef<Map<string, number>>(new Map());
  const lastReadMarkerByRoomRef = useRef<Map<string, string>>(new Map());
  const readDividerPlacementByRoomRef = useRef<Map<string, ReadDividerPlacement>>(
    new Map(),
  );
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

  const publishScrollToAnchor = useCallback(
    (lastReadMessageId: string | null | undefined) => {
      reopenScrollKeyRef.current += 1;
      setScrollToAnchor({
        anchorId: lastReadMessageId ?? undefined,
        key: reopenScrollKeyRef.current,
      });
    },
    [],
  );

  const applySessionReadBoundary = useCallback(
    (
      rid: string,
      lastReadMessageId: string | null,
      placement: ReadDividerPlacement,
    ) => {
      if (lastReadMessageId) {
        lastReadMarkerByRoomRef.current.set(rid, lastReadMessageId);
        readDividerPlacementByRoomRef.current.set(rid, placement);
        setReadMarkerMessageId(lastReadMessageId);
      } else {
        lastReadMarkerByRoomRef.current.delete(rid);
        readDividerPlacementByRoomRef.current.delete(rid);
        setReadMarkerMessageId(null);
      }
      setReadDividerPlacement(placement);
    },
    [],
  );

  const clearSessionReadBoundary = useCallback((rid: string) => {
    lastReadMarkerByRoomRef.current.delete(rid);
    readDividerPlacementByRoomRef.current.delete(rid);
    setReadMarkerMessageId(null);
    setReadDividerPlacement(EMPTY_READ_DIVIDER_PLACEMENT);
  }, []);

  useEffect(() => {
    if (!roomId) {
      setRawMessages([]);
      setReadMarkerMessageId(null);
      setReadDividerPlacement(EMPTY_READ_DIVIDER_PLACEMENT);
      prevRoomForHistoryGateRef.current = null;
      prevFetchHistoryRef.current = false;
      historyFetchedRoomIdsRef.current.clear();
      hasMoreByRoomRef.current.clear();
      hasMoreNewerByRoomRef.current.clear();
      lastSequenceByRoomRef.current.clear();
      lastReadMarkerByRoomRef.current.clear();
      readDividerPlacementByRoomRef.current.clear();
      recoveringSequenceRoomsRef.current.clear();
      setHasMore(true);
      setHasMoreNewer(false);
      setIsFetchingOlder(false);
      setIsFetchingNewer(false);
      isFetchingOlderRef.current = false;
      isFetchingNewerRef.current = false;
      setScrollToAnchor(null);
      return;
    }

    if (!fetchHistory) {
      const prevR = prevRoomForHistoryGateRef.current;
      if (prevR !== null && prevR !== roomId) {
        setRawMessages([]);
        setHasMore(true);
        setHasMoreNewer(false);
      }
      prevRoomForHistoryGateRef.current = roomId;
      prevFetchHistoryRef.current = false;
      setReadMarkerMessageId(null);
      setReadDividerPlacement(EMPTY_READ_DIVIDER_PLACEMENT);
      setScrollToAnchor(null);
      return;
    }

    const reopened = prevFetchHistoryRef.current === false;
    prevFetchHistoryRef.current = true;
    prevRoomForHistoryGateRef.current = roomId;

    if (userId == null) return;

    const gateKey = chatHistoryGateKey(userId, roomId);
    const ridTrim = roomId.trim();

    if (historyFetchedRoomIdsRef.current.has(gateKey)) {
      const hm = hasMoreByRoomRef.current.get(roomId);
      setHasMore(hm !== false);
      const hmn = hasMoreNewerByRoomRef.current.get(roomId);
      setHasMoreNewer(hmn === true);

      const savedLastRead = lastReadMarkerByRoomRef.current.get(ridTrim);
      const savedPlacement = readDividerPlacementByRoomRef.current.get(ridTrim);
      if (reopened && savedLastRead && savedPlacement) {
        setReadMarkerMessageId(savedLastRead);
        setReadDividerPlacement(savedPlacement);
      }

      if (!reopened) return;

      let cancelledReopen = false;
      void (async () => {
        try {
          const { lastReadMessageId } =
            await getRoomMessageReadStatus(roomId);
          if (cancelledReopen) return;

          if (lastReadMessageId) {
            const beforeSlice = [...rawMessagesRef.current];
            const bridged = await mergeSliceWithReadBridge(
              roomId,
              lastReadMessageId,
              beforeSlice,
              beforeSlice,
            );
            if (cancelledReopen) return;

            applyBridgedSlice(
              roomId,
              bridged,
              {
                hasMoreNewerByRoom: hasMoreNewerByRoomRef.current,
                lastSequenceByRoom: lastSequenceByRoomRef.current,
              },
              { setHasMoreNewer, setRawMessages },
              queryClient,
            );

            applySessionReadBoundary(
              ridTrim,
              lastReadMessageId,
              resolveReadDividerPlacement(
                bridged.slice,
                lastReadMessageId,
                bridged.placementBeforeSlice,
              ),
            );
          } else {
            applySessionReadBoundary(
              ridTrim,
              null,
              EMPTY_READ_DIVIDER_PLACEMENT,
            );
          }

          publishScrollToAnchor(lastReadMessageId);
        } catch {
          const fallbackLastRead = lastReadMarkerByRoomRef.current.get(ridTrim);
          const fallbackPlacement =
            readDividerPlacementByRoomRef.current.get(ridTrim);
          if (fallbackLastRead && fallbackPlacement) {
            setReadMarkerMessageId(fallbackLastRead);
            setReadDividerPlacement(fallbackPlacement);
            publishScrollToAnchor(fallbackLastRead);
          }
        }
      })();
      return () => {
        cancelledReopen = true;
      };
    }

    setRawMessages([]);
    setHasMore(true);
    setHasMoreNewer(false);
    setReadMarkerMessageId(null);
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

        let slice = mergeServerMessageLists(
          out.serverSlice,
          transientMessagesDuringRoomHistoryFetch(rawMessagesRef.current),
        );
        let hasMoreNewer = out.hasMoreNewer;
        let warmHistory = [...out.warmHistory];
        let placementBeforeSlice: readonly ServerChatMessage[] = out.serverSlice;

        if (out.lastReadMessageId) {
          const bridged = await mergeSliceWithReadBridge(
            roomId,
            out.lastReadMessageId,
            slice,
            out.serverSlice,
          );
          if (cancelled) return;
          slice = bridged.slice;
          placementBeforeSlice = bridged.placementBeforeSlice;
          if (bridged.bridgedHasMoreNewer != null) {
            hasMoreNewer = bridged.bridgedHasMoreNewer;
          }
          if (bridged.bridgedSlice?.length) {
            warmHistory = mergeServerMessageLists(
              warmHistory,
              bridged.bridgedSlice,
            );
          }
        }

        hasMoreByRoomRef.current.set(roomId, out.hasMoreOlder);
        hasMoreNewerByRoomRef.current.set(roomId, hasMoreNewer);
        setHasMore(out.hasMoreOlder);
        setHasMoreNewer(hasMoreNewer);

        applySessionReadBoundary(
          ridTrim,
          out.lastReadMessageId,
          out.lastReadMessageId
            ? resolveReadDividerPlacement(
                slice,
                out.lastReadMessageId,
                placementBeforeSlice,
              )
            : EMPTY_READ_DIVIDER_PLACEMENT,
        );

        setRawMessages(slice);
        bumpRoomLastSequence(lastSequenceByRoomRef.current, roomId, slice);
        historyFetchedRoomIdsRef.current.add(gateKey);
        void warmPlacePhotoQueriesFromChatHistory(queryClient, warmHistory);

        const newest = newestServerMessageByCreatedAt(slice);
        if (newest && !hasMoreNewer) {
          resetReadDedup();
          markMessagesRead(newest.id);
        }

        publishScrollToAnchor(out.lastReadMessageId);
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
    publishScrollToAnchor,
    applySessionReadBoundary,
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
        clearSessionReadBoundary(rid.trim());
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
  }, [roomId, queryClient, clearSessionReadBoundary]);

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

  const rid = roomId?.trim() ?? "";
  const effectiveReadMarkerMessageId =
    fetchHistory && rid
      ? readMarkerMessageId ?? lastReadMarkerByRoomRef.current.get(rid) ?? null
      : null;
  const savedPlacement = rid
    ? readDividerPlacementByRoomRef.current.get(rid)
    : undefined;
  const effectiveReadDividerPlacement: ReadDividerPlacement | null =
    fetchHistory && rid
      ? readDividerPlacement.afterMessageId != null ||
        readDividerPlacement.beforeFirst
        ? readDividerPlacement
        : (savedPlacement ?? null)
      : null;

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
    readMarkerMessageId: effectiveReadMarkerMessageId,
    readDividerPlacement: effectiveReadDividerPlacement,
    scrollToAnchor,
    markMessagesRead,
  };
}
