import type { Client } from "@stomp/stompjs";
import type { MutableRefObject } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { dispatchRoomBookmarksToast } from "@/lib/stomp/bookmarks-dispatch";
import { parseRoomPresenceMessage } from "@/lib/stomp/events";
import { parseRoomMemberMessage } from "@/lib/stomp/member-events";
import { dispatchRoomMemberEvent } from "@/lib/stomp/members-dispatch";
import { dispatchRoomPresenceToast } from "@/lib/stomp/presence-dispatch";
import { parseRoomScheduleMessage } from "@/lib/stomp/schedule-events";
import { dispatchRoomScheduleEvent } from "@/lib/stomp/schedules-dispatch";
import { parseRoomLifecycleMessage } from "@/lib/stomp/room-lifecycle-events";
import { dispatchUserErrorToast } from "@/lib/stomp/user-error-dispatch";
import { parseUserErrorMessage } from "@/lib/stomp/user-error-events";
import { parseUserRoomActionMessage } from "@/lib/stomp/user-room-action-events";

export type RoomTopicsUnsubscriber = () => void;

export type ForcedRoomExitReason = "kicked" | "room_deleted";

export type SubscribeRoomStompTopicsOptions = {
  onForcedRoomExit: (reason: ForcedRoomExitReason) => void;
};

/** 방 단위 members·presence·bookmarks·schedules·lifecycle + 개인 큐(`/user/queue/errors`, `/user/queue/rooms`) 구독; 반환값으로 한 번에 해제 */
export function subscribeRoomStompTopics(
  client: Client,
  roomId: string,
  queryClientRef: MutableRefObject<QueryClient>,
  options: SubscribeRoomStompTopicsOptions,
): RoomTopicsUnsubscriber {
  const subscribedRoomId = roomId.trim();
  let exitHandled = false;

  const tryForcedExit = (
    reason: ForcedRoomExitReason,
    eventRoomId: string,
  ): void => {
    if (eventRoomId.trim() !== subscribedRoomId) return;
    if (exitHandled) return;
    exitHandled = true;
    options.onForcedRoomExit(reason);
  };

  const membersSub = client.subscribe(
    `/topic/rooms/${subscribedRoomId}/members`,
    (message) => {
      void (async () => {
        const event = parseRoomMemberMessage(message.body);
        if (!event) return;
        await dispatchRoomMemberEvent(
          queryClientRef.current,
          subscribedRoomId,
          event,
        );
      })();
    },
  );

  const presenceSub = client.subscribe(
    `/topic/rooms/${subscribedRoomId}/presence`,
    (message) => {
      const event = parseRoomPresenceMessage(message.body);
      if (!event) return;
      dispatchRoomPresenceToast(queryClientRef.current, subscribedRoomId, event);
    },
  );

  const bookmarksSub = client.subscribe(
    `/topic/rooms/${subscribedRoomId}/bookmarks`,
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
    `/topic/rooms/${subscribedRoomId}/schedules`,
    (message) => {
      void (async () => {
        const event = parseRoomScheduleMessage(message.body);
        if (!event) return;
        await dispatchRoomScheduleEvent(queryClientRef.current, event);
      })();
    },
  );

  const userErrorsSub = client.subscribe(`/user/queue/errors`, (message) => {
    const payload = parseUserErrorMessage(message.body);
    if (!payload) return;
    dispatchUserErrorToast(payload);
  });

  const lifecycleSub = client.subscribe(
    `/topic/rooms/${subscribedRoomId}/lifecycle`,
    (message) => {
      const payload = parseRoomLifecycleMessage(message.body);
      if (!payload) return;
      tryForcedExit("room_deleted", payload.roomId);
    },
  );

  const userRoomsSub = client.subscribe(`/user/queue/rooms`, (message) => {
    const payload = parseUserRoomActionMessage(message.body);
    if (!payload) return;
    tryForcedExit(
      payload.actionType === "KICKED" ? "kicked" : "room_deleted",
      payload.roomId,
    );
  });

  return () => {
    membersSub.unsubscribe();
    presenceSub.unsubscribe();
    bookmarksSub.unsubscribe();
    schedulesSub.unsubscribe();
    userErrorsSub.unsubscribe();
    lifecycleSub.unsubscribe();
    userRoomsSub.unsubscribe();
  };
}
