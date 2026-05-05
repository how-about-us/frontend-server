import { useEffect, useRef, useState, useCallback } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import type {
  ChatMessage,
  ServerChatMessage,
  ServerChatMessageType,
} from "@/types/chat";
import { useStompContext } from "@/contexts/StompContext";
import { setRoomMemberChatListener } from "@/lib/stomp/members-dispatch";
import { useSessionStore } from "@/stores/session-store";
import { getRoomMembers, getRoomMessages } from "@/lib/api/rooms";
import type { RoomMember } from "@/lib/api/rooms";

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
  const { client, connected } = useStompContext();
  const userId = useSessionStore((s) => s.user?.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const memberMapRef = useRef<MemberMap>(new Map());
  const subscriptionRef = useRef<StompSubscription | null>(null);

  // 방 입장 시 멤버 목록 + 이전 메시지 내역 로드 (각각 독립적으로 처리)
  useEffect(() => {
    if (!roomId) return;

    setMessages([]);
    memberMapRef.current = new Map();

    let cancelled = false;

    // 멤버 목록과 메시지 내역을 독립적으로 로드 — 하나가 실패해도 다른 하나에 영향 없음
    Promise.allSettled([
      getRoomMembers(roomId),
      getRoomMessages(roomId),
    ]).then(([membersResult, messagesResult]) => {
      if (cancelled) return;

      if (membersResult.status === "fulfilled") {
        const map: MemberMap = new Map(
          membersResult.value.members.map((m) => [
            m.userId,
            { nickname: m.nickname, profileImageUrl: m.profileImageUrl },
          ]),
        );
        memberMapRef.current = map;
      }

      if (messagesResult.status === "fulfilled") {
        const fromRest = messagesResult.value.map((m) =>
          toUiMessage(m, userId, memberMapRef.current),
        );
        setMessages((prev) => {
          const systemDuringFetch = prev.filter((m) => m.type === "system");
          return [...fromRest, ...systemDuringFetch];
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [roomId, userId]);

  /** members 토픽 브로드캐스트 → 채팅 시스템 메시지 (subscribeRoomStompTopics 단일 구독 경로) */
  useEffect(() => {
    if (!roomId) return;

    setRoomMemberChatListener(roomId, (line) => {
      setMessages((prev) => [
        ...prev,
        {
          id: line.id,
          type: "system",
          text: line.text,
          time: formatTime(line.createdAt) || undefined,
          sender: `system:${line.id}`,
        },
      ]);
    });

    return () => {
      setRoomMemberChatListener(roomId, null);
    };
  }, [roomId]);

  // WebSocket 구독 — 새 메시지 실시간 수신 (REST 실패와 무관하게 동작)
  useEffect(() => {
    if (!client || !connected || !roomId) return;

    subscriptionRef.current?.unsubscribe();

    subscriptionRef.current = client.subscribe(
      `/topic/rooms/${roomId}/messages`,
      (stompMsg) => {
        try {
          const msg: ServerChatMessage = JSON.parse(stompMsg.body);
          setMessages((prev) => [
            ...prev,
            toUiMessage(msg, userId, memberMapRef.current),
          ]);
        } catch {
          // malformed message — ignore
        }
      },
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [client, connected, roomId, userId]);

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
