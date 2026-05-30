import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useStompContext } from "@/contexts/StompContext";
import { toast } from "sonner";

import {
  HttpError,
  approveJoinRequest,
  createBookmarkCategory,
  createRoomBookmark,
  createRoomBookmarks,
  createRoom,
  createRoomSchedule,
  createScheduleItem,
  deleteScheduleItem,
  reorderScheduleItem,
  updateScheduleItem,
  deleteRoomBookmark,
  deleteBookmarkCategory,
  deleteRoom,
  deleteRoomSchedule,
  getBookmarkCategories,
  getJoinRequests,
  getJoinStatus,
  getRoomBookmarks,
  getRoomMembers,
  getRoomSchedules,
  patchRoomBookmarkCategory,
  getRooms,
  joinRoom,
  kickMember,
  leaveRoom,
  regenerateInviteCode,
  rejectJoinRequest,
  type BookmarkCategory,
  type RoomCreateRequest,
  type RoomScheduleCreateRequest,
  type ReorderScheduleItemRequest,
  type RoomScheduleItemUpdateRequest,
  type RoomUpdateRequest,
  transferHost,
  updateBookmarkCategory,
  updateRoom,
  type RoomDetail,
  type RoomListResponse,
  type RoomSchedule,
} from "@/lib/api/rooms";
import {
  applyRoomScheduleItemToPlanPlaces,
  createScheduleItemAtPlanIndex,
  defaultNewItemStartTimeHmAtInsertIndex,
  defaultNewItemStartTimeHmFromPlanPlaces,
  fetchScheduleItemsAsPlanPlaces,
  syncPlanPlacesAfterReorderSuccess,
} from "@/lib/plan/scheduleItemPlaces";
import { sortRoomSchedules } from "@/lib/plan/scheduleMerge";
import {
  bookmarkCategoriesQueryKey,
  joinRequestsQueryKey,
  roomBookmarksByRoomRootQueryKey,
  roomBookmarksQueryKey,
  ROOMS_QUERY_KEY,
  roomDetailQueryKey,
  roomMembersQueryKey,
  roomSchedulesQueryKey,
  scheduleItemsQueryKey,
} from "@/lib/query-keys";
import {
  hydrateRoomSchedulesFromServer,
  syncRoomDetailFromServer,
} from "@/lib/rooms";
import {
  pathDefersRoomStompRoomTopics,
  pathSuspendsStomp,
} from "@/lib/stomp/stompPathPolicy";
import { persistedScheduleItemRouteQueryOptions } from "@/lib/plan/scheduleItemRoutePersistedQuery";
import type { ScheduleTravelModeValue } from "@/lib/plan/scheduleTravelMode";
import type { PlanPlace } from "@/lib/plan/types";
import { useSessionUser } from "@/hooks/useSessionUser";

export function useRoomsList() {
  return useQuery({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: () => getRooms(),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RoomCreateRequest) => createRoom(data),
    onSuccess: async (room) => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
      await hydrateRoomSchedulesFromServer(queryClient, room.id);
      await syncRoomDetailFromServer(queryClient, room.id);
    },
  });
}

export function useRoomSchedules(roomId: string | null) {
  const id = roomId?.trim() ?? "";
  return useQuery({
    queryKey: roomSchedulesQueryKey(id || null),
    queryFn: () => getRoomSchedules(id),
    enabled: id.length > 0,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useScheduleItemRoute(
  roomId: string | null,
  scheduleId: number | null,
  segmentSourceItemId: number | null,
  travelMode: ScheduleTravelModeValue,
  /** 일정 장소 목록상 구간 소스 아이디가 존재·목록 안정 후에만 true */
  routeQueryEnabled = true,
  /** 빈 문자열이면 LS 미사용 — `scheduleFingerprint` 지문 필요 */
  scheduleFingerprint = "",
) {
  const rid = roomId?.trim() ?? "";

  return useQuery({
    ...persistedScheduleItemRouteQueryOptions(
      rid,
      scheduleId,
      segmentSourceItemId,
      travelMode,
      scheduleFingerprint,
      { segmentReady: Boolean(routeQueryEnabled) },
    ),
  });
}

export function useDeleteRoomSchedule() {
  return useMutation({
    mutationFn: ({
      roomId,
      scheduleId,
    }: {
      roomId: string;
      scheduleId: number;
    }) => deleteRoomSchedule(roomId, scheduleId),
    /** UI·캐시는 `SCHEDULE_DELETED` STOMP(`dispatchRoomScheduleEvent`)에서만 갱신합니다. */
  });
}

/**
 * 일차(schedule) 생성 — 액터는 POST 응답으로 목록 캐시를 즉시 머지하고,
 * 다른 클라이언트는 STOMP `SCHEDULE_CREATED`로 갱신합니다.
 */
export function useCreateRoomSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      body,
    }: {
      roomId: string;
      body: RoomScheduleCreateRequest;
    }) => createRoomSchedule(roomId, body),
    onSuccess: async (created, { roomId }) => {
      const id = roomId.trim();
      if (!id.length) return;
      queryClient.setQueryData<RoomSchedule[]>(
        roomSchedulesQueryKey(id),
        (prev) => {
          const list = prev ? [...prev, created] : [created];
          return sortRoomSchedules(list);
        },
      );
      await syncRoomDetailFromServer(queryClient, id);
    },
  });
}

export function useSchedulePlanPlaces(
  roomId: string | null,
  scheduleId: number | null,
) {
  const rid = roomId?.trim() ?? "";
  const sid = scheduleId;
  return useQuery({
    queryKey: scheduleItemsQueryKey(rid || null, sid),
    queryFn: () => fetchScheduleItemsAsPlanPlaces(rid, sid!),
    enabled:
      rid.length > 0 && typeof sid === "number" && Number.isFinite(sid),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateScheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      roomId: string;
      scheduleId: number;
      googlePlaceId: string;
      startTimeHm?: string;
      insertIndex?: number;
      placesSnapshot?: PlanPlace[];
    }) => {
      const places = vars.placesSnapshot ?? [];
      const insertIndex = vars.insertIndex ?? places.length;
      const startTimeHm =
        vars.startTimeHm ??
        (insertIndex >= places.length
          ? defaultNewItemStartTimeHmFromPlanPlaces(places)
          : defaultNewItemStartTimeHmAtInsertIndex(places, insertIndex));

      return createScheduleItemAtPlanIndex(queryClient, {
        roomId: vars.roomId,
        scheduleId: vars.scheduleId,
        places,
        insertIndex,
        googlePlaceId: vars.googlePlaceId,
        startTimeHm,
      });
    },
  });
}

export function useUpdateScheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      roomId: string;
      scheduleId: number;
      itemId: number;
      body: RoomScheduleItemUpdateRequest;
    }) =>
      updateScheduleItem(
        vars.roomId,
        vars.scheduleId,
        vars.itemId,
        vars.body,
      ),
    onSuccess: (updated, { roomId, scheduleId, body }) => {
      const rid = roomId.trim();
      if (!rid.length) return;
      const key = scheduleItemsQueryKey(rid, scheduleId);
      const prev = queryClient.getQueryData<PlanPlace[]>(key);
      const merged = applyRoomScheduleItemToPlanPlaces(prev, updated, {
        memoTouched: Object.prototype.hasOwnProperty.call(body, "memo"),
      });
      if (merged) {
        queryClient.setQueryData(key, merged);
      } else {
        void queryClient.invalidateQueries({
          queryKey: key,
          refetchType: "active",
        });
      }
    },
  });
}

export function useDeleteScheduleItem() {
  return useMutation({
    mutationFn: (vars: {
      roomId: string;
      scheduleId: number;
      itemId: number;
    }) => deleteScheduleItem(vars.roomId, vars.scheduleId, vars.itemId),
  });
}

export function useReorderScheduleItem() {
  const queryClient = useQueryClient();
  const [isChainedTimeSyncPending, setIsChainedTimeSyncPending] =
    useState(false);
  const mutation = useMutation({
    mutationFn: (vars: {
      roomId: string;
      scheduleId: number;
      itemId: number;
      body: ReorderScheduleItemRequest;
    }) =>
      reorderScheduleItem(
        vars.roomId,
        vars.scheduleId,
        vars.itemId,
        vars.body,
      ),
    onMutate: () => {
      setIsChainedTimeSyncPending(true);
    },
    onError: () => {
      setIsChainedTimeSyncPending(false);
    },
    onSuccess: async (items, { roomId, scheduleId, itemId }) => {
      try {
        await syncPlanPlacesAfterReorderSuccess(
          queryClient,
          roomId,
          scheduleId,
          items,
          itemId,
        );
      } finally {
        setIsChainedTimeSyncPending(false);
      }
    },
  });

  return {
    ...mutation,
    /** 리오더 요청 + 시작 시각 연쇄 PATCH까지(캐시가 일관될 때까지) */
    isReorderSettling:
      mutation.isPending || isChainedTimeSyncPending,
  };
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      data,
    }: {
      roomId: string;
      data: RoomUpdateRequest;
    }) => updateRoom(roomId, data),
    onSuccess: (updated, { roomId }) => {
      queryClient.setQueryData<RoomListResponse>(ROOMS_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.id === roomId ?
              {
                ...r,
                title: updated.title,
                destination: updated.destination,
                startDate: updated.startDate ?? null,
                endDate: updated.endDate ?? null,
              }
            : r,
          ),
        };
      });
      queryClient.setQueryData<RoomDetail>(
        roomDetailQueryKey(roomId),
        (prev) =>
          prev && prev.id === roomId ?
            {
              ...prev,
              title: updated.title,
              destination: updated.destination,
              startDate: updated.startDate ?? null,
              endDate: updated.endDate ?? null,
            }
          : prev,
      );
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => regenerateInviteCode(roomId),
    onSuccess: (data, roomId) => {
      queryClient.setQueryData<RoomDetail>(
        roomDetailQueryKey(roomId),
        (prev) => (prev ? { ...prev, inviteCode: data.inviteCode } : prev),
      );
    },
  });
}

export function useRoomMembers(roomId: string | null) {
  const pathname = usePathname();
  const { data: user } = useSessionUser();
  const { connected: stompConnected } = useStompContext();

  /**
   * 방 토픽을 구독하는 구간에서는 STOMP 연결·`/app/ping` 이전에 GET /members 가 먼저 나가면
   * `isOnline` 이 모두 false 로 내려오는 경우가 있다. STOMP 연결 후에만 조회한다.
   * `/home` 등 방 토픽을 미루는 경로는 즉시 조회(ping은 연결 단위로 계속 전송).
   */
  const waitForStompBeforeMembers =
    Boolean(user && roomId) &&
    !pathSuspendsStomp(pathname) &&
    !pathDefersRoomStompRoomTopics(pathname);

  return useQuery({
    queryKey: roomMembersQueryKey(roomId),
    queryFn: () => getRoomMembers(roomId!),
    enabled: !!roomId && (!waitForStompBeforeMembers || stompConnected),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useJoinRoom() {
  return useMutation({
    mutationFn: (inviteCode: string) => joinRoom(inviteCode),
  });
}

export function useCheckJoinStatus() {
  return useMutation({
    mutationFn: (roomId: string) => getJoinStatus(roomId),
  });
}

export function useJoinRequests(
  roomId: string | null,
  options?: { enabled?: boolean },
) {
  const userEnabled = options?.enabled ?? true;
  return useQuery({
    queryKey: joinRequestsQueryKey(roomId),
    queryFn: () => getJoinRequests(roomId!),
    enabled: !!roomId && userEnabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useTransferHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      targetUserId,
    }: {
      roomId: string;
      targetUserId: number;
    }) => transferHost(roomId, targetUserId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomMembersQueryKey(roomId) });
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useLeaveRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => leaveRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, userId }: { roomId: string; userId: number }) =>
      kickMember(roomId, userId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomMembersQueryKey(roomId) });
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      requestId,
    }: {
      roomId: string;
      requestId: number;
    }) => approveJoinRequest(roomId, requestId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: joinRequestsQueryKey(roomId) });
      queryClient.invalidateQueries({ queryKey: roomMembersQueryKey(roomId) });
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      requestId,
    }: {
      roomId: string;
      requestId: number;
    }) => rejectJoinRequest(roomId, requestId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: joinRequestsQueryKey(roomId) });
    },
  });
}

export function useBookmarkCategories(
  roomId: string | null,
  options?: { enabled?: boolean },
) {
  const queryEnabled = options?.enabled ?? true;
  return useQuery({
    queryKey: bookmarkCategoriesQueryKey(roomId),
    queryFn: () => getBookmarkCategories(roomId!),
    enabled: !!roomId && queryEnabled,
    staleTime: 0,
  });
}

export function useCreateBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      name,
      colorCode,
    }: {
      roomId: string;
      name: string;
      colorCode: string;
    }) => createBookmarkCategory(roomId, { name, colorCode }),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export function useUpdateBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      categoryId,
      name,
      colorCode,
    }: {
      roomId: string;
      categoryId: number;
      name: string;
      colorCode: string;
    }) => updateBookmarkCategory(roomId, categoryId, { name, colorCode }),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export function useDeleteBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      categoryId,
    }: {
      roomId: string;
      categoryId: number;
    }) => deleteBookmarkCategory(roomId, categoryId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export function useRoomBookmarks(
  roomId: string | null,
  categoryId: number | null,
) {
  const idOk =
    categoryId != null && Number.isFinite(categoryId) && categoryId >= 0;
  return useQuery({
    queryKey: roomBookmarksQueryKey(roomId, idOk ? categoryId : null),
    queryFn: () => getRoomBookmarks(roomId!, categoryId!),
    enabled: !!roomId && idOk,
    staleTime: 0,
  });
}

export function useCreateRoomBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      googlePlaceId,
      categoryId,
    }: {
      roomId: string;
      googlePlaceId: string;
      categoryId: number;
    }) => createRoomBookmark(roomId, { googlePlaceId, categoryId }),
    onSuccess: (_, { roomId, categoryId }) => {
      queryClient.setQueryData<BookmarkCategory[]>(
        bookmarkCategoriesQueryKey(roomId),
        (prev) => {
          if (!prev?.length) return prev;
          return prev.map((c) =>
            c.categoryId === categoryId
              ? { ...c, placeCount: c.placeCount + 1 }
              : c,
          );
        },
      );
      void queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, categoryId),
      });
    },
  });
}

export type CreateRoomBookmarksInCategoriesResult = {
  added: number;
  skippedDuplicate: number;
  /** Stopped early; categories after this were not attempted. */
  firstHardError: Error | null;
  /** Categories that received a successful POST (for local cache only). */
  addedCategoryIds: number[];
};

/** POST 한 번으로 `googlePlaceId` + `categoryIds` 배열 전달. STOMP와 함께 목록 캐시도 즉시 무효화합니다. */
export function useCreateRoomBookmarksInCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      googlePlaceId,
      categoryIds,
    }: {
      roomId: string;
      googlePlaceId: string;
      categoryIds: number[];
    }): Promise<CreateRoomBookmarksInCategoriesResult> => {
      try {
        const bookmarks = await createRoomBookmarks(roomId, {
          googlePlaceId,
          categoryIds,
        });
        const addedCategoryIds = bookmarks.map((b) => b.categoryId);
        const added = bookmarks.length;
        const skippedDuplicate = Math.max(0, categoryIds.length - added);
        return {
          added,
          skippedDuplicate,
          firstHardError: null,
          addedCategoryIds,
        };
      } catch (e) {
        if (e instanceof HttpError && e.status === 409) {
          return {
            added: 0,
            skippedDuplicate: categoryIds.length,
            firstHardError: null,
            addedCategoryIds: [],
          };
        }
        return {
          added: 0,
          skippedDuplicate: 0,
          firstHardError: e instanceof Error ? e : new Error(String(e)),
          addedCategoryIds: [],
        };
      }
    },
    onSuccess: (result, { roomId }) => {
      if (!result.addedCategoryIds.length) return;
      queryClient.setQueryData<BookmarkCategory[]>(
        bookmarkCategoriesQueryKey(roomId),
        (prev) => {
          if (!prev?.length) return prev;
          const bumped = new Set(result.addedCategoryIds);
          return prev.map((c) =>
            bumped.has(c.categoryId)
              ? { ...c, placeCount: c.placeCount + 1 }
              : c,
          );
        },
      );
      void queryClient.invalidateQueries({
        queryKey: roomBookmarksByRoomRootQueryKey(roomId),
      });
    },
  });
}

export function useMoveRoomBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      bookmarkId,
      categoryId,
    }: {
      roomId: string;
      bookmarkId: number;
      categoryId: number;
      fromCategoryId: number;
    }) => patchRoomBookmarkCategory(roomId, bookmarkId, { categoryId }),
    onSuccess: (_, { roomId, categoryId, fromCategoryId }) => {
      queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, fromCategoryId),
      });
      queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, categoryId),
      });
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export function useDeleteRoomBookmarkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      roomId: string;
      bookmarkId: number;
      categoryId: number;
    }) => deleteRoomBookmark(input.roomId, input.bookmarkId),
    onSuccess: (_, { roomId, categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, categoryId),
      });
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}
