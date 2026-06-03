import type { ServerChatMessage } from "@/types/chat";
import { getRoomMessages } from "@/lib/api/rooms";
import {
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
 * lastReadMessageId 기준 afterId·latest fallback 분기는 여기서만 유지한다.
 */
export type InitialRoomHistoryLoadResult = {
  serverSlice: ServerChatMessage[];
  hasMoreOlder: boolean;
  hasMoreNewer: boolean;
  initialScrollAnchorId: string | undefined;
  warmHistory: ServerChatMessage[];
};

async function loadLatestRoomHistoryPage(
  roomId: string,
  pageSize: number,
): Promise<InitialRoomHistoryLoadResult> {
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

export async function loadInitialRoomHistory(
  roomId: string,
  lastReadMessageId: string | null,
  pageSize: number,
): Promise<InitialRoomHistoryLoadResult> {
  if (!lastReadMessageId) {
    return loadLatestRoomHistoryPage(roomId, pageSize);
  }

  const afterRows = await getRoomMessages(roomId, {
    afterId: lastReadMessageId,
    size: pageSize,
  });
  const normalizedAfter = normalizeFetchedRoomMessages(afterRows);

  if (normalizedAfter.length === 0) {
    return loadLatestRoomHistoryPage(roomId, pageSize);
  }

  const anchor = oldestServerMessageByCreatedAt(normalizedAfter);

  return {
    serverSlice: normalizedAfter,
    hasMoreOlder: true,
    hasMoreNewer: hasOlderHistoryPage(normalizedAfter.length, pageSize),
    initialScrollAnchorId: anchor?.id,
    warmHistory: normalizedAfter,
  };
}
