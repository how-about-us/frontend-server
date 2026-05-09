import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { useStompContext } from "@/contexts/StompContext";
import { toast } from "sonner";

import {
  HttpError,
  approveJoinRequest,
  createBookmarkCategory,
  createRoomBookmark,
  createRoom,
  createRoomSchedule,
  createScheduleItem,
  deleteScheduleItem,
  getScheduleItems,
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
  seedRoomSchedules,
  transferHost,
  updateBookmarkCategory,
  updateRoom,
  type RoomDetail,
  type RoomListResponse,
  type RoomSchedule,
} from "@/lib/api/rooms";
import {
  applyRoomScheduleItemToPlanPlaces,
  buildChainedStartPatchesForReorder,
  fetchScheduleItemsAsPlanPlaces,
  mergeOrRefetchSchedulePlanPlacesFromItems,
  sortRoomScheduleItemsByOrder,
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
import { syncRoomDetailFromServer } from "@/lib/rooms";
import {
  pathDefersRoomStompRoomTopics,
  pathSuspendsStomp,
} from "@/lib/stomp/stompPathPolicy";
import { persistedScheduleItemRouteQueryOptions } from "@/lib/plan/scheduleItemRoutePersistedQuery";
import type { ScheduleTravelModeValue } from "@/lib/plan/scheduleTravelMode";
import type { PlanPlace } from "@/lib/plan/types";
import { useSessionStore } from "@/stores/session-store";

export function useRoomsList() {
  return useQuery({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: () => getRooms(),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RoomCreateRequest) => {
      const room = await createRoom(data);
      await seedRoomSchedules(room.id, data.startDate, data.endDate);
      return room;
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(room.id),
      });
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
  return useMutation({
    mutationFn: (vars: {
      roomId: string;
      scheduleId: number;
      googlePlaceId: string;
      startTimeHm: string;
    }) =>
      createScheduleItem(vars.roomId, vars.scheduleId, {
        googlePlaceId: vars.googlePlaceId,
        startTime: vars.startTimeHm,
        durationMinutes: 60,
      }),
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
    onSuccess: (updated, { roomId, scheduleId }) => {
      const rid = roomId.trim();
      if (!rid.length) return;
      const key = scheduleItemsQueryKey(rid, scheduleId);
      const prev = queryClient.getQueryData<PlanPlace[]>(key);
      const merged = applyRoomScheduleItemToPlanPlaces(prev, updated);
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
  return useMutation({
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
    onSuccess: async (items, { roomId, scheduleId }) => {
      const rid = roomId.trim();
      if (!rid.length) return;
      await mergeOrRefetchSchedulePlanPlacesFromItems(
        queryClient,
        roomId,
        scheduleId,
        items,
      );

      const patches = buildChainedStartPatchesForReorder(items);
      if (patches.length === 0) return;

      const snapshot = sortRoomScheduleItemsByOrder(items);
      const byItemId = new Map(snapshot.map((it) => [it.itemId, it]));

      try {
        for (const p of patches) {
          const updated = await updateScheduleItem(rid, scheduleId, p.itemId, {
            startTime: p.startTime,
            durationMinutes: p.durationMinutes,
          });
          byItemId.set(updated.itemId, updated);
        }
      } catch {
        toast.error("순서에 맞게 시작 시간을 바꾸지 못했어요.");
        try {
          const fresh = await getScheduleItems(rid, scheduleId);
          await mergeOrRefetchSchedulePlanPlacesFromItems(
            queryClient,
            roomId,
            scheduleId,
            fresh,
          );
        } catch {
          //
        }
        return;
      }

      await mergeOrRefetchSchedulePlanPlacesFromItems(
        queryClient,
        roomId,
        scheduleId,
        sortRoomScheduleItemsByOrder([...byItemId.values()]),
      );
    },
  });
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
  return useMutation({
    mutationFn: (roomId: string) => regenerateInviteCode(roomId),
  });
}

export function useRoomMembers(roomId: string | null) {
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const { connected: stompConnected } = useStompContext();

  /**
   * 방 토픽을 구독하는 구간에서는 세션 presence ping 이전에 GET /members 가 먼저 나가면
   * `isOnline` 이 모두 false 로 내려오는 경우가 있다. STOMP 연결 후에만 조회한다.
   * `/home` 등 토픽을 미루는 경로는 기존처럼 즉시 조회(해당 구간에서는 ping 미전송).
   */
  const waitForStompBeforeMembers =
    Boolean(user && roomId) &&
    !pathSuspendsStomp(pathname) &&
    !pathDefersRoomStompRoomTopics(pathname);

  return useQuery({
    queryKey: roomMembersQueryKey(roomId),
    queryFn: () => getRoomMembers(roomId!),
    enabled: !!roomId && (!waitForStompBeforeMembers || stompConnected),
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
      queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, categoryId),
      });
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
    },
  });
}

export type CreateRoomBookmarksInCategoriesResult = {
  added: number;
  skippedDuplicate: number;
  /** Stopped early; categories after this were not attempted. */
  firstHardError: Error | null;
};

/** Sequentially POST one bookmark per category; invalidates category + list caches once. */
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
      let added = 0;
      let skippedDuplicate = 0;
      let firstHardError: Error | null = null;
      for (const categoryId of categoryIds) {
        try {
          await createRoomBookmark(roomId, { googlePlaceId, categoryId });
          added += 1;
        } catch (e) {
          if (e instanceof HttpError && e.status === 409) {
            skippedDuplicate += 1;
          } else {
            firstHardError = e instanceof Error ? e : new Error(String(e));
            break;
          }
        }
      }
      return { added, skippedDuplicate, firstHardError };
    },
    onSettled: (_data, _err, { roomId, categoryIds }) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
      queryClient.invalidateQueries({
        queryKey: roomBookmarksByRoomRootQueryKey(roomId),
      });
      for (const cid of categoryIds) {
        queryClient.invalidateQueries({
          queryKey: roomBookmarksQueryKey(roomId, cid),
        });
      }
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
