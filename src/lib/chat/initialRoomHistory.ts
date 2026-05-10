import type { ServerChatMessage } from "@/types/chat";
import { getRoomMessages } from "@/lib/api/rooms";
import {
  mergeServerMessageLists,
  newestServerMessageByCreatedAt,
  normalizeFetchedRoomMessages,
  oldestServerMessageByCreatedAt,
} from "@/lib/chat";

export function hasOlderHistoryPage(
  fetchedLength: number,
  pageSize: number,
): boolean {
  return fetchedLength >= pageSize;
}

/**
 * 패널 최초 히스토리 GET — `useChatMessages`에서만 사용.
 * lastSeen 이후 갭·최신 30만 등 분기는 여기서만 유지한다.
 */
export type InitialRoomHistoryLoadResult = {
  serverSlice: ServerChatMessage[];
  hasMoreOlder: boolean;
  hasMoreNewer: boolean;
  initialScrollAnchorId: string | undefined;
  warmHistory: ServerChatMessage[];
};

export async function loadInitialRoomHistory(
  roomId: string,
  lastSeenId: string | null,
  pageSize: number,
): Promise<InitialRoomHistoryLoadResult> {
  if (!lastSeenId) {
    const history = await getRoomMessages(roomId, { size: pageSize });
    const normalized = normalizeFetchedRoomMessages(history);
    return {
      serverSlice: normalized,
      hasMoreOlder: hasOlderHistoryPage(normalized.length, pageSize),
      hasMoreNewer: false,
      initialScrollAnchorId: undefined,
      warmHistory: normalized,
    };
  }

  const latestRows = await getRoomMessages(roomId, { size: pageSize });
  const normalizedLatest = normalizeFetchedRoomMessages(latestRows);
  const newestInLatest = newestServerMessageByCreatedAt(normalizedLatest);
  const lastSeenInLatest = normalizedLatest.some((m) => m.id === lastSeenId);
  const caughtUpAtTip =
    newestInLatest != null && newestInLatest.id === lastSeenId;

  if (caughtUpAtTip || lastSeenInLatest) {
    return {
      serverSlice: normalizedLatest,
      hasMoreOlder: hasOlderHistoryPage(normalizedLatest.length, pageSize),
      hasMoreNewer: false,
      initialScrollAnchorId: undefined,
      warmHistory: normalizedLatest,
    };
  }

  const afterRows = await getRoomMessages(roomId, {
    afterId: lastSeenId,
    size: pageSize,
  });
  const normalizedAfter = normalizeFetchedRoomMessages(afterRows);

  if (normalizedAfter.length === 0) {
    return {
      serverSlice: normalizedLatest,
      hasMoreOlder: hasOlderHistoryPage(normalizedLatest.length, pageSize),
      hasMoreNewer: false,
      initialScrollAnchorId: undefined,
      warmHistory: normalizedLatest,
    };
  }

  const merged = mergeServerMessageLists(normalizedAfter, normalizedLatest);
  const anchor = oldestServerMessageByCreatedAt(normalizedAfter);

  return {
    serverSlice: merged,
    hasMoreOlder: true,
    hasMoreNewer: hasOlderHistoryPage(normalizedAfter.length, pageSize),
    initialScrollAnchorId: anchor?.id,
    warmHistory: merged,
  };
}
