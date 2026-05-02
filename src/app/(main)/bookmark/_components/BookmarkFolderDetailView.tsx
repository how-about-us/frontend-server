"use client";

import { useQueries } from "@tanstack/react-query";
import { getPlaceCardPropsByGoogleId } from "@/lib/api/places";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useRoomBookmarks } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import type { BookmarkFolder, BookmarkedPlace } from "@/types/bookmark";
import { BookmarkFolderDetailHeader } from "./BookmarkFolderDetailHeader";
import { BookmarkPlaceRow } from "./BookmarkPlaceRow";

const SCROLLBAR =
  "min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(0,0,0,0.2)_transparent]";

export function BookmarkFolderDetailView({ folder }: { folder: BookmarkFolder }) {
  const { setSelectedPlace } = useSelectedPlace();
  const roomId = useSessionStore((s) => s.currentRoomId);
  const categoryId = Number.parseInt(folder.id, 10);
  const categoryIdOk = Number.isFinite(categoryId) ? categoryId : null;

  const {
    data: bookmarkRows,
    isPending: bookmarksLoading,
    isError: bookmarksError,
    error: bookmarksErr,
    refetch,
  } = useRoomBookmarks(roomId, categoryIdOk);

  const placeQueries = useQueries({
    queries: (bookmarkRows ?? []).map((b) => ({
      queryKey: [
        "place-card-bookmark",
        roomId,
        b.googlePlaceId,
        b.bookmarkId,
      ] as const,
      queryFn: async () => {
        const card = await getPlaceCardPropsByGoogleId(b.googlePlaceId);
        return { ...card, id: String(b.bookmarkId) } satisfies BookmarkedPlace;
      },
      enabled: !!roomId && !!b.googlePlaceId && bookmarkRows != null,
      staleTime: 60_000,
    })),
  });

  const places: BookmarkedPlace[] =
    !bookmarkRows?.length
      ? []
      : placeQueries
          .map((q) => q.data)
          .filter((p): p is BookmarkedPlace => p != null);

  const cardsLoading =
    (bookmarkRows?.length ?? 0) > 0 &&
    placeQueries.some((q) => q.isPending || q.isFetching);

  if (!roomId) {
    return (
      <>
        <BookmarkFolderDetailHeader folder={folder} />
        <div className={`${SCROLLBAR} px-6 py-10`}>
          <p className="text-center text-sm text-dark-gray">
            방을 선택한 뒤 보관함을 열어 주세요.
          </p>
        </div>
      </>
    );
  }

  if (categoryIdOk == null) {
    return (
      <>
        <BookmarkFolderDetailHeader folder={folder} />
        <div className={`${SCROLLBAR} px-6 py-10`}>
          <p className="text-center text-sm text-dark-gray">
            유효하지 않은 카테고리입니다.
          </p>
        </div>
      </>
    );
  }

  if (bookmarksLoading) {
    return (
      <>
        <BookmarkFolderDetailHeader folder={folder} />
        <div className={`${SCROLLBAR} px-6 py-10`}>
          <p className="text-center text-sm text-dark-gray">불러오는 중…</p>
        </div>
      </>
    );
  }

  if (bookmarksError) {
    return (
      <>
        <BookmarkFolderDetailHeader folder={folder} />
        <div className={`${SCROLLBAR} space-y-3 px-6 py-10`}>
          <p className="text-center text-sm text-brand-red">
            {bookmarksErr instanceof Error
              ? bookmarksErr.message
              : "목록을 불러오지 못했습니다."}
          </p>
          <div className="text-center">
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium text-neutral-900 underline"
            >
              다시 시도
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BookmarkFolderDetailHeader folder={folder} />
      <div className={SCROLLBAR}>
        {cardsLoading && places.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-dark-gray">
            장소 정보를 불러오는 중…
          </p>
        ) : places.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-dark-gray">
            담긴 장소가 없습니다.
          </p>
        ) : (
          places.map((row) => (
            <BookmarkPlaceRow
              key={row.id}
              place={row}
              roomId={roomId}
              currentCategoryId={categoryIdOk}
              onOpenDetail={() => {
                const { id: _id, ...card } = row;
                setSelectedPlace(card);
              }}
            />
          ))
        )}
      </div>
    </>
  );
}
