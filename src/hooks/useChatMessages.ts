import { useEffect, useState, useMemo } from "react";
import type { ServerChatMessage } from "@/types/chat";
import {
  deriveAiRequestConversationState,
  mergeServerMessageLists,
  normalizeMessageKind,
  normalizeServerChatMessage,
  parseFiniteNumber,
  serverMessageToChatMessage,
} from "@/lib/chat";
import { useStompContext } from "@/contexts/StompContext";
import { useSessionStore } from "@/stores/session-store";
import { getRoomMessages } from "@/lib/api/rooms";
import type { RoomMember } from "@/lib/api/rooms";
import { useRoomMembers } from "@/hooks/useRooms";
import { useChatActions } from "@/hooks/useChatActions";

export function useChatMessages(roomId: string | null) {
  const { setRoomChatMessageHandler } = useStompContext();
  const userId = useSessionStore((s) => s.user?.id);
  const { data: membersData } = useRoomMembers(roomId);
  const [rawMessages, setRawMessages] = useState<ServerChatMessage[]>([]);
  const {
    sendChatMessage,
    sendAiMessage,
    sendPlaceMessage,
    sendCancelAiRequest,
  } = useChatActions();

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
      return;
    }

    setRawMessages([]);
    let cancelled = false;

    getRoomMessages(roomId).then((history) => {
      if (cancelled) return;
      const normalizedHistory = history.map(
        (row) => normalizeServerChatMessage(row) ?? row,
      );
      setRawMessages((prev) => {
        const systemDuringFetch = prev.filter((m) => {
          const k = normalizeMessageKind(m.messageType);
          return k === "SYSTEM" || k === "PLACE_SHARE" || k === "AI_REQUEST";
        });
        return mergeServerMessageLists(normalizedHistory, systemDuringFetch);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

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
    sendPlaceMessage,
    sendCancelAiRequest,
  };
}
