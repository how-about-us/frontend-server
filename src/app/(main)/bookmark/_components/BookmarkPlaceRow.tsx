"use client";

import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SearchResultCard } from "@/components/place";
import {
  useBookmarkCategories,
  useDeleteRoomBookmarkItem,
  useMoveRoomBookmark,
} from "@/hooks/useRooms";
import type { BookmarkedPlace } from "@/types/bookmark";

type MenuPhase = "main" | "pickCategory";

export function BookmarkPlaceRow({
  place,
  roomId,
  currentCategoryId,
  onOpenDetail,
}: {
  place: BookmarkedPlace;
  roomId: string;
  currentCategoryId: number;
  onOpenDetail: () => void;
}) {
  const { id, ...card } = place;
  const bookmarkId = Number.parseInt(id, 10);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPhase, setMenuPhase] = useState<MenuPhase>("main");
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useBookmarkCategories(roomId);
  const { mutate: moveBookmark, isPending: moving } = useMoveRoomBookmark();
  const { mutate: deleteItem, isPending: deleting } =
    useDeleteRoomBookmarkItem();

  const busy = moving || deleting;
  const otherCategories =
    categories?.filter((c) => c.categoryId !== currentCategoryId) ?? [];

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuPhase("main");
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [menuOpen, closeMenu]);

  const handleMoveTo = (targetCategoryId: number) => {
    if (!Number.isFinite(bookmarkId) || busy) return;
    moveBookmark(
      {
        roomId,
        bookmarkId,
        categoryId: targetCategoryId,
        fromCategoryId: currentCategoryId,
      },
      { onSuccess: () => closeMenu() },
    );
  };

  const handleDelete = () => {
    if (!Number.isFinite(bookmarkId) || busy) return;
    const ok = window.confirm("이 장소를 보관함에서 삭제할까요?");
    if (!ok) return;
    closeMenu();
    deleteItem({ roomId, bookmarkId, categoryId: currentCategoryId });
  };

  return (
    <div className="relative flex items-stretch border-b border-gray-border bg-white">
      <SearchResultCard
        {...card}
        className="min-w-0 flex-1 border-0 hover:bg-gray-50 active:bg-gray-100"
        onClick={onOpenDetail}
      />
      <div className="relative flex shrink-0 items-center" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => {
              if (o) {
                setMenuPhase("main");
                return false;
              }
              return true;
            });
          }}
          disabled={busy}
          className="rounded-lg p-2 text-dark-gray cursor-pointer"
          aria-label="장소 메뉴"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="size-5" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full z-30 mt-1 w-[min(calc(100vw-2rem),220px)] overflow-hidden rounded-xl border border-gray-border bg-white py-1 shadow-lg"
            role="menu"
          >
            {menuPhase === "main" ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-sm text-neutral-900 hover:bg-bubble-gray disabled:opacity-50"
                  disabled={busy}
                  onClick={() => setMenuPhase("pickCategory")}
                >
                  카테고리 변경
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-sm text-brand-red hover:bg-red-50 disabled:opacity-50"
                  disabled={busy}
                  onClick={handleDelete}
                >
                  {deleting ? "삭제 중…" : "삭제"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="flex w-full items-center gap-1 px-3 py-2 text-left text-sm font-medium text-neutral-800 hover:bg-bubble-gray"
                  onClick={() => setMenuPhase("main")}
                >
                  <ChevronLeft className="size-4 shrink-0" />
                  뒤로
                </button>
                <div className="my-1 border-t border-gray-border" />
                {otherCategories.length === 0 ? (
                  <p className="px-4 py-3 text-center text-xs text-dark-gray">
                    이동할 다른 카테고리가 없습니다.
                  </p>
                ) : (
                  otherCategories.map((c) => (
                    <button
                      key={c.categoryId}
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-900 hover:bg-bubble-gray disabled:opacity-50"
                      disabled={busy}
                      onClick={() => handleMoveTo(c.categoryId)}
                    >
                      <span
                        className="size-3 shrink-0 rounded-full border border-black/10"
                        style={{ backgroundColor: c.colorCode }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
