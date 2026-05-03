import type { Client } from "@stomp/stompjs";
import type { MutableRefObject } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { dispatchRoomBookmarksToast } from "@/lib/stomp/bookmarks-dispatch";
import { parseRoomPresenceMessage } from "@/lib/stomp/events";
import { dispatchRoomPresenceToast } from "@/lib/stomp/presence-dispatch";
import { parseRoomScheduleMessage } from "@/lib/stomp/schedule-events";
import { dispatchRoomScheduleEvent } from "@/lib/stomp/schedules-dispatch";
import { dispatchUserErrorToast } from "@/lib/stomp/user-error-dispatch";
import { parseUserErrorMessage } from "@/lib/stomp/user-error-events";

export type RoomTopicsUnsubscriber = () => void;

/** 방 단위 presence·bookmarks·schedules + 개인 에러 큐(`/user/queue/errors`) 구독; 반환값으로 한 번에 해제 */
export function subscribeRoomStompTopics(
  client: Client,
  roomId: string,
  queryClientRef: MutableRefObject<QueryClient>,
  currentUserId: number,
): RoomTopicsUnsubscriber {
  const presenceSub = client.subscribe(
    `/topic/rooms/${roomId}/presence`,
    (message) => {
      void (async () => {
        const event = parseRoomPresenceMessage(message.body);
        if (!event) return;
        await dispatchRoomPresenceToast(queryClientRef.current, roomId, event);
      })();
    },
  );

  const bookmarksSub = client.subscribe(
    `/topic/rooms/${roomId}/bookmarks`,
    (message) => {
      void (async () => {
        try {
          await dispatchRoomBookmarksToast(
            queryClientRef.current,
            message.body,
          );
        } catch {
          // malformed payload / 네트워크 — 무시
        }
      })();
    },
  );

  const schedulesSub = client.subscribe(
    `/topic/rooms/${roomId}/schedules`,
    (message) => {
      void (async () => {
        const event = parseRoomScheduleMessage(message.body);
        if (!event) return;
        await dispatchRoomScheduleEvent(
          queryClientRef.current,
          event,
          currentUserId,
        );
      })();
    },
  );

  const userErrorsSub = client.subscribe(`/user/queue/errors`, (message) => {
    const payload = parseUserErrorMessage(message.body);
    if (!payload) return;
    dispatchUserErrorToast(payload);
  });

  return () => {
    presenceSub.unsubscribe();
    bookmarksSub.unsubscribe();
    schedulesSub.unsubscribe();
    userErrorsSub.unsubscribe();
  };
}
