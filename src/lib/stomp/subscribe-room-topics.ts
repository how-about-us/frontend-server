import type { Client } from "@stomp/stompjs";
import type { MutableRefObject } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { dispatchRoomBookmarksToast } from "@/lib/stomp/bookmarks-dispatch";
import { parseRoomPresenceMessage } from "@/lib/stomp/events";
import { dispatchRoomPresenceToast } from "@/lib/stomp/presence-dispatch";

export type RoomTopicsUnsubscriber = () => void;

/** 방 단위 presence·bookmarks 구독; 반환값으로 한 번에 해제 */
export function subscribeRoomStompTopics(
  client: Client,
  roomId: string,
  queryClientRef: MutableRefObject<QueryClient>,
): RoomTopicsUnsubscriber {
  const presenceSub = client.subscribe(
    `/topic/rooms/${roomId}/presence`,
    (message) => {
      void (async () => {
        const event = parseRoomPresenceMessage(message.body);
        if (!event) return;
        await dispatchRoomPresenceToast(
          queryClientRef.current,
          roomId,
          event,
        );
      })();
    },
  );

  const bookmarksSub = client.subscribe(
    `/topic/rooms/${roomId}/bookmarks`,
    (message) => {
      void (async () => {
        try {
          await dispatchRoomBookmarksToast(queryClientRef.current, message.body);
        } catch {
          // malformed payload / 네트워크 — 무시
        }
      })();
    },
  );

  return () => {
    presenceSub.unsubscribe();
    bookmarksSub.unsubscribe();
  };
}
