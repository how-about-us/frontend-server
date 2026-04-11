export type RoomRole = "ADMIN" | "MEMBER";
export type ConnectionStatus = "online" | "offline";

export type RoomMember = {
  id: string;
  name: string;
  avatarInitial: string;
  role: RoomRole;
  status: ConnectionStatus;
  isCurrentUser?: boolean;
};

export const MOCK_ROOM_MEMBERS: RoomMember[] = [
  {
    id: "user-1",
    name: "김민준",
    avatarInitial: "김",
    role: "ADMIN",
    status: "online",
    isCurrentUser: true,
  },
  {
    id: "user-2",
    name: "이서연",
    avatarInitial: "이",
    role: "MEMBER",
    status: "online",
  },
  {
    id: "user-3",
    name: "박지호",
    avatarInitial: "박",
    role: "MEMBER",
    status: "online",
  },
  {
    id: "user-4",
    name: "최유나",
    avatarInitial: "최",
    role: "MEMBER",
    status: "offline",
  },
  {
    id: "user-5",
    name: "정다은",
    avatarInitial: "정",
    role: "MEMBER",
    status: "offline",
  },
];
