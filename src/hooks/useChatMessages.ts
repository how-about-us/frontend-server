import { useEffect, useRef, useState, useCallback } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import type { ChatMessage, ServerChatMessage } from "@/types/chat";
import { useStompContext } from "@/contexts/StompContext";
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

function toUiMessage(
  msg: ServerChatMessage,
  currentUserId: number | undefined,
  memberMap: MemberMap,
): ChatMessage {
  const member = memberMap.get(msg.senderId);
  return {
    id: msg.id,
    type: msg.senderId === currentUserId ? "mine" : "other",
    sender: member?.nickname,
    avatar: member?.profileImageUrl ?? undefined,
    text: msg.content,
    time: formatTime(msg.createdAt) || undefined,
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
        setMessages(
          messagesResult.value.map((m) =>
            toUiMessage(m, userId, memberMapRef.current),
          ),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [roomId, userId]);

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
