// Re-export errors used by room consumers (HttpError, duplicate bookmark codes)
export {
  HttpError,
  ROOM_BOOKMARK_DUPLICATE_ERROR_CODES,
  isRoomBookmarkDuplicateFromBody,
  readApiErrorCodeFromJson,
} from "@/lib/api/errors";

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
} from "./schedule-items";

export {
  createRoomSchedule,
  deleteRoomSchedule,
  getRoomSchedules,
  seedRoomSchedules,
  syncRoomSchedulesToDateRange,
} from "./schedules";

export {
  createScheduleItem,
  getScheduleItems,
} from "./schedule-items";

export {
  approveJoinRequest,
  getJoinRequests,
  getJoinStatus,
  joinRoom,
  rejectJoinRequest,
} from "./join";

export {
  getRoomMembers,
  kickMember,
  leaveRoom,
  transferHost,
} from "./members";

export { getRoomMessages } from "./messages";
