import type { ServerChatMessage } from "@/types/chat";
import { getRoomMessages } from "@/lib/api/rooms";
import { normalizeFetchedRoomMessages } from "@/lib/chat";

export function hasOlderHistoryPage(
  fetchedLength: number,
  pageSize: number,
): boolean {
  return fetchedLength >= pageSize;
}

/**
 * 패널 최초 히스토리 GET — `useChatMessages`에서만 사용.
 * lastReadMessageId 기준 beforeId(exclusive)·latest fallback 분기는 여기서만 유지한다.
 * lastRead·unread 슬라이스는 호출 측 bridge fetch로 보강한다.
 */
export type InitialRoomHistoryLoadResult = {
  serverSlice: ServerChatMessage[];
  hasMoreOlder: boolean;
  hasMoreNewer: boolean;
  /** read-status의 lastReadMessageId — 스크롤·구분선 기준 (null이면 마커 없음) */
  lastReadMessageId: string | null;
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
    lastReadMessageId: null,
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

  const beforeRows = await getRoomMessages(roomId, {
    beforeId: lastReadMessageId,
    size: pageSize,
  });
  const normalizedBefore = normalizeFetchedRoomMessages(beforeRows);

  return {
    serverSlice: normalizedBefore,
    hasMoreOlder: hasOlderHistoryPage(normalizedBefore.length, pageSize),
    hasMoreNewer: true,
    lastReadMessageId,
    warmHistory: normalizedBefore,
  };
}
