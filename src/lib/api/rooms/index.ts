export { HttpError } from "@/lib/api/errors";

export type {
  BookmarkCategory,
  BookmarkCategoryCreateRequest,
  BookmarkCategoryUpdateRequest,
  JoinRequest,
  JoinRequestListResponse,
  JoinRoomResponse,
  RoomBookmark,
  RoomBookmarkCategoryPatchRequest,
  RoomBookmarkCreateRequest,
  RoomCreateRequest,
  RoomCreateResponse,
  RoomDetail,
  RoomListItem,
  RoomListResponse,
  RoomMember,
  RoomMemberListResponse,
  RoomMessage,
  RoomUpdateRequest,
} from "./types";

export type { JoinRoomApiResult } from "./join";

export {
  createBookmarkCategory,
  deleteBookmarkCategory,
  getBookmarkCategories,
  updateBookmarkCategory,
} from "./bookmark-categories";

export {
  createRoomBookmark,
  deleteRoomBookmark,
  getRoomBookmarks,
  patchRoomBookmarkCategory,
} from "./bookmarks";

export {
  createRoom,
  deleteRoom,
  getRoomDetail,
  getRooms,
  regenerateInviteCode,
  updateRoom,
} from "./core";

export type { RoomSchedule, RoomScheduleCreateRequest } from "./schedules";

export type {
  RoomScheduleItem,
  RoomScheduleItemCreateRequest,
  RoomScheduleItemUpdateRequest,
  ReorderScheduleItemRequest,
  ScheduleItemRouteLeg,
  ScheduleItemRouteResponse,
} from "./schedule-items";

export {
  createRoomSchedule,
  deleteRoomSchedule,
  getRoomSchedules,
  seedRoomSchedules,
} from "./schedules";

export {
  createScheduleItem,
  deleteScheduleItem,
  getScheduleItems,
  getScheduleItemRoute,
  reorderScheduleItem,
  updateScheduleItem,
} from "./schedule-items";

export {
  approveJoinRequest,
  getJoinRequests,
  getJoinStatus,
  joinRoom,
  rejectJoinRequest,
} from "./join";

export { getRoomMembers, kickMember, leaveRoom, transferHost } from "./members";

export { getRoomMessages } from "./messages";
