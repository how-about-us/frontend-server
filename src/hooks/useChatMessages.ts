import { useEffect, useState, useMemo } from "react";
import type { ChatMessage, PlaceShareData, ServerChatMessage } from "@/types/chat";
import { pickProfileImageUrl } from "@/lib/api/profileImage";
import { normalizeMessageKind } from "@/lib/chat/messageKind";
import {
  normalizeServerChatMessage,
  parseFiniteNumber,
} from "@/lib/chat/normalizeServerChatMessage";
import { useStompContext } from "@/contexts/StompContext";
import { useSessionStore } from "@/stores/session-store";
import { getRoomMessages } from "@/lib/api/rooms";
import type { RoomMember } from "@/lib/api/rooms";
import { useRoomMembers } from "@/hooks/useRooms";
import { useChatActions } from "@/hooks/useChatActions";

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

/** Record<string,string> 기반 metadata 를 PlaceShareData 로 안전 파싱 */
function parsePlaceShareMetadata(
  metadata: Record<string, string> | undefined,
): PlaceShareData | null {
  if (!metadata) return null;
  const lat = Number(metadata.latitude);
  const lng = Number(metadata.longitude);
  const rating = Number(metadata.rating);
  const googlePlaceId = metadata.googlePlaceId ?? "";
  const name = metadata.name ?? "";
  if (!googlePlaceId || !name || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return {
    googlePlaceId,
    name,
    formattedAddress: metadata.formattedAddress ?? "",
    latitude: lat,
    longitude: lng,
    photoName: metadata.photoName ?? "",
    rating: Number.isNaN(rating) ? 0 : rating,
  };
}

function toUiMessage(
  msg: ServerChatMessage,
  currentUserId: number | undefined,
  memberMap: MemberMap,
): ChatMessage {
  const kind = normalizeMessageKind(msg.messageType);
  const time = formatTime(msg.createdAt) || undefined;

  if (kind === "PLACE_SHARE") {
    const place = parsePlaceShareMetadata(msg.metadata);
    const senderUserId = parseFiniteNumber(msg.senderId) ?? msg.senderId;
    const member = memberMap.get(senderUserId);
    const meta = msg.metadata;
    const metaNick =
      typeof meta?.nickname === "string"
        ? meta.nickname.trim()
        : typeof meta?.senderNickname === "string"
          ? meta.senderNickname.trim()
          : "";
    const metaAvatar =
      meta != null
        ? pickProfileImageUrl(meta as unknown as Record<string, unknown>)
        : null;
    const displayNick =
      member?.nickname?.trim() ||
      (metaNick.length > 0 ? metaNick : undefined);

    if (place) {
      return {
        id: msg.id,
        type: "place",
        text: msg.content || "장소 공유",
        time,
        sender: displayNick,
        senderUserId,
        avatar: member?.profileImageUrl ?? metaAvatar ?? undefined,
        place,
      };
    }
    return {
      id: msg.id,
      type: "system",
      text: msg.content || "장소 공유",
      time,
      sender: `system:${msg.id}`,
    };
  }

  if (kind === "SYSTEM") {
    return {
      id: msg.id,
      type: "system",
      text: msg.content,
      time,
      sender: `system:${msg.id}`,
    };
  }

  if (kind === "AI_RESPONSE" || kind === "AI") {
    return {
      id: msg.id,
      type: "ai",
      text: msg.content,
      time,
      sender: "WOORI",
    };
  }

  if (kind === "CHAT" || kind === "AI_REQUEST") {
    const senderUserId = parseFiniteNumber(msg.senderId) ?? msg.senderId;
    const member = memberMap.get(senderUserId);
    const meta = msg.metadata;
    const metaNick =
      typeof meta?.nickname === "string"
        ? meta.nickname.trim()
        : typeof meta?.senderNickname === "string"
          ? meta.senderNickname.trim()
          : "";
    const metaAvatar =
      meta != null
        ? pickProfileImageUrl(meta as unknown as Record<string, unknown>)
        : null;

    const uid = parseFiniteNumber(currentUserId);
    const isMine = uid !== undefined && senderUserId === uid;

    const displayNick =
      member?.nickname?.trim() ||
      (metaNick.length > 0 ? metaNick : undefined);

    return {
      id: msg.id,
      type: isMine ? "mine" : "other",
      sender: displayNick,
      senderUserId,
      avatar: member?.profileImageUrl ?? metaAvatar ?? undefined,
      text: msg.content,
      time,
      ...(kind === "AI_REQUEST" ? { isAiRequest: true as const } : {}),
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
  const { setRoomChatMessageHandler } = useStompContext();
  const userId = useSessionStore((s) => s.user?.id);
  const { data: membersData } = useRoomMembers(roomId);
  const [rawMessages, setRawMessages] = useState<ServerChatMessage[]>([]);
  const { sendChatMessage, sendAiMessage, sendPlaceMessage } = useChatActions();

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
      const normalizedHistory = history.map(
        (row) => normalizeServerChatMessage(row) ?? row,
      );
      setRawMessages((prev) => {
        const systemDuringFetch = prev.filter((m) => {
          const k = normalizeMessageKind(m.messageType);
          return k === "SYSTEM" || k === "PLACE_SHARE" || k === "AI_REQUEST";
        });
        return [...normalizedHistory, ...systemDuringFetch];
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

  return {
    messages,
    sendChatMessage,
    sendAiMessage,
    sendPlaceMessage,
  };
}
