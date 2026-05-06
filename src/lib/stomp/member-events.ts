import { pickProfileImageUrl } from "@/lib/api/profileImage";

export type RoomMemberBroadcastType =
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "MEMBER_KICKED"
  | "HOST_DELEGATED";

type RoomMemberPayloadBase = {
  content: string;
  createdAt: string;
  id: string;
  roomId: string;
};

/** MEMBER_JOINED / MEMBER_LEFT / MEMBER_KICKED metadata에서 공통 스냅샷 */
export type MemberUserSnapshotDetail = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
};

export type HostDelegatedDetail = {
  previousHostUserId: number;
  previousHostNickname: string;
  newHostUserId: number;
  newHostNickname: string;
};

/** `/topic/rooms/{roomId}/members` 브로드캐스트 본문 — metadata 파싱 결과를 `detail`로 둡니다 */
export type RoomMemberPayload =
  | (RoomMemberPayloadBase & {
      type: "MEMBER_JOINED";
      detail: MemberUserSnapshotDetail | null;
    })
  | (RoomMemberPayloadBase & {
      type: "MEMBER_LEFT";
      detail: MemberUserSnapshotDetail | null;
    })
  | (RoomMemberPayloadBase & {
      type: "MEMBER_KICKED";
      detail: MemberUserSnapshotDetail | null;
    })
  | (RoomMemberPayloadBase & {
      type: "HOST_DELEGATED";
      detail: HostDelegatedDetail | null;
    });

function parseMetadataRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

function parseFiniteNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** JOIN 시에는 닉네임 필수, LEFT/KICKED 는 userId 만 필수 */
function parseMemberUserSnapshot(
  meta: Record<string, unknown>,
  requireNickname: boolean,
): MemberUserSnapshotDetail | null {
  const userId = parseFiniteNumber(meta.userId);
  if (userId == null) return null;

  const nicknameRaw = meta.nickname;
  const nicknameTrim =
    typeof nicknameRaw === "string" ? nicknameRaw.trim() : "";
  if (requireNickname && !nicknameTrim) return null;

  const nickname =
    nicknameTrim.length > 0 ? nicknameTrim : `유저 #${userId}`;
  const profileImageUrl = pickProfileImageUrl(meta);

  return { userId, nickname, profileImageUrl };
}

function parseHostDelegated(
  meta: Record<string, unknown>,
): HostDelegatedDetail | null {
  const previousHostUserId = parseFiniteNumber(meta.previousHostUserId);
  const newHostUserId = parseFiniteNumber(meta.newHostUserId);
  if (previousHostUserId == null || newHostUserId == null) return null;

  const prevNickRaw = meta.previousHostNickname;
  const newNickRaw = meta.newHostNickname;
  const previousHostNickname =
    typeof prevNickRaw === "string" ? prevNickRaw.trim() : "";
  const newHostNickname =
    typeof newNickRaw === "string" ? newNickRaw.trim() : "";

  return {
    previousHostUserId,
    previousHostNickname:
      previousHostNickname.length > 0
        ? previousHostNickname
        : `유저 #${previousHostUserId}`,
    newHostUserId,
    newHostNickname:
      newHostNickname.length > 0
        ? newHostNickname
        : `유저 #${newHostUserId}`,
  };
}

export function parseRoomMemberMessage(body: string): RoomMemberPayload | null {
  try {
    const raw = JSON.parse(body) as Record<string, unknown>;
    const type = raw?.type;
    if (
      type !== "MEMBER_JOINED" &&
      type !== "MEMBER_LEFT" &&
      type !== "MEMBER_KICKED" &&
      type !== "HOST_DELEGATED"
    ) {
      return null;
    }

    const roomIdRaw = raw.roomId;
    const roomId =
      typeof roomIdRaw === "string"
        ? roomIdRaw
        : roomIdRaw != null
          ? String(roomIdRaw)
          : "";

    const content = typeof raw.content === "string" ? raw.content : "";
    const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";
    const id =
      typeof raw.id === "string"
        ? raw.id
        : raw.id != null
          ? String(raw.id)
          : "";

    const base: RoomMemberPayloadBase = {
      roomId,
      content,
      createdAt,
      id,
    };

    const meta = parseMetadataRecord(raw.metadata);

    switch (type) {
      case "MEMBER_JOINED":
        return {
          ...base,
          type,
          detail: parseMemberUserSnapshot(meta, true),
        };
      case "MEMBER_LEFT":
      case "MEMBER_KICKED":
        return {
          ...base,
          type,
          detail: parseMemberUserSnapshot(meta, false),
        };
      case "HOST_DELEGATED":
        return {
          ...base,
          type,
          detail: parseHostDelegated(meta),
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
