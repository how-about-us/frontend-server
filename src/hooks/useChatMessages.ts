import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type {
  ChatMessage,
  ServerChatMessage,
  ServerChatMessageType,
} from "@/types/chat";
import { useStompContext } from "@/contexts/StompContext";
import { useSessionStore } from "@/stores/session-store";
import { getRoomMessages } from "@/lib/api/rooms";
import type { RoomMember } from "@/lib/api/rooms";
import { useRoomMembers } from "@/hooks/useRooms";

type MemberMap = Map<number, Pick<RoomMember, "nickname" | "profileImageUrl">>;

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function normalizeMessageKind(raw: ServerChatMessageType | unknown): string {
  if (raw == null) return "CHAT";
  if (typeof raw !== "string") return "CHAT";
  const t = raw.trim();
  if (!t) return "CHAT";
  return t.toUpperCase();
}

function toUiMessage(
  msg: ServerChatMessage,
  currentUserId: number | undefined,
  memberMap: MemberMap,
): ChatMessage {
  const kind = normalizeMessageKind(msg.messageType);
  const time = formatTime(msg.createdAt) || undefined;

  if (kind === "SYSTEM" || kind === "PLACE_SHARE") {
    return {
      id: msg.id,
      type: "system",
      text: msg.content,
      time,
      sender: `system:${msg.id}`,
    };
  }

  if (
    kind === "AI_REQUEST" ||
    kind === "AI_RESPONSE" ||
    kind === "AI"
  ) {
    return {
      id: msg.id,
      type: "ai",
      text: msg.content,
      time,
      sender: "WOORI",
    };
  }

  if (kind === "CHAT") {
    const member = memberMap.get(msg.senderId);
    return {
      id: msg.id,
      type: msg.senderId === currentUserId ? "mine" : "other",
      sender: member?.nickname,
      senderUserId: msg.senderId,
      avatar: member?.profileImageUrl ?? undefined,
      text: msg.content,
      time,
    };
  }

  return {
    id: msg.id,
    type: "system",
    text: msg.content,
    time,
    sender: `system:${msg.id}`,
  };
}

export function useChatMessages(roomId: string | null) {
  const { client, connected, setRoomChatMessageHandler } = useStompContext();
  const userId = useSessionStore((s) => s.user?.id);
  const { data: membersData } = useRoomMembers(roomId);
  const [rawMessages, setRawMessages] = useState<ServerChatMessage[]>([]);

  const memberMap = useMemo(() => {
    const members = membersData?.members;
    if (!members?.length) {
      return new Map<number, Pick<RoomMember, "nickname" | "profileImageUrl">>();
    }
    return new Map(
      members.map((m) => [
        m.userId,
        { nickname: m.nickname, profileImageUrl: m.profileImageUrl },
      ]),
    );
  }, [membersData?.members]);

  const messages = useMemo(
    () => rawMessages.map((m) => toUiMessage(m, userId, memberMap)),
    [rawMessages, userId, memberMap],
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
      setRawMessages((prev) => {
        const systemDuringFetch = prev.filter((m) => {
          const k = normalizeMessageKind(m.messageType);
          return k === "SYSTEM" || k === "PLACE_SHARE";
        });
        return [...history, ...systemDuringFetch];
      });
    });

    return () => {
      cancelled = true;
    };
  }, [roomId, userId]);

  useEffect(() => {
    if (!roomId) {
      setRoomChatMessageHandler(null);
      return;
    }

    const handler = (msg: ServerChatMessage) => {
      setRawMessages((prev) => [...prev, msg]);
    };
    setRoomChatMessageHandler(handler);
    return () => setRoomChatMessageHandler(null);
  }, [roomId, setRoomChatMessageHandler]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!client || !connected || !roomId || !content.trim()) return;
      client.publish({
        destination: `/app/rooms/${roomId}/messages/chat`,
        body: JSON.stringify({
          clientMessageId: crypto.randomUUID(),
          content: content.trim(),
        }),
      });
    },
    [client, connected, roomId],
  );

  return { messages, sendMessage };
}
