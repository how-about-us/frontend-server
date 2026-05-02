"use client";

import { BookmarkPlus, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useBookmarkCategories,
  useCreateBookmarkCategory,
  useDeleteBookmarkCategory,
} from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import type { BookmarkFolder } from "@/types/bookmark";
import { useBookmarkFolders } from "../context";
import { bookmarkFolderPath } from "../routes";
import { AddBookmarkModal } from "./AddBookmarkModal";
import { FolderRibbonIcon } from "./FolderRibbonIcon";

export function BookmarkFoldersView() {
  const roomId = useSessionStore((s) => s.currentRoomId);
  const { folders } = useBookmarkFolders();
  const {
    isPending,
    isError,
    error,
    refetch,
  } = useBookmarkCategories(roomId);
  const { mutate: createCategory, isPending: isCreating } =
    useCreateBookmarkCategory();
  const {
    mutate: deleteCategory,
    isPending: isDeleting,
    variables: deleteVariables,
  } = useDeleteBookmarkCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpenId(null), []);

  useEffect(() => {
    if (!menuOpenId) return;
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
  }, [menuOpenId, closeMenu]);

  const openCreate = () => {
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleSave = ({ title, color }: { title: string; color: string }) => {
    if (!roomId) return;
    createCategory(
      { roomId, name: title, colorCode: color },
      {
        onSuccess: () => {
          setModalOpen(false);
        },
      },
    );
  };

  const handleDelete = (folder: BookmarkFolder) => {
    if (!roomId) return;
    const categoryId = Number.parseInt(folder.id, 10);
    if (!Number.isFinite(categoryId)) return;

    const ok = window.confirm(
      `「${folder.title}」 카테고리를 삭제할까요? 소속 보관함 항목도 함께 삭제됩니다.`,
    );
    if (!ok) return;

    closeMenu();
    deleteCategory({ roomId, categoryId });
  };

  const isRowDeleting = (folderId: string) =>
    isDeleting &&
    deleteVariables != null &&
    String(deleteVariables.categoryId) === folderId;

  if (!roomId) {
    return (
      <div className="px-6 py-10 text-center text-sm text-dark-gray">
        보관함을 보려면 먼저 방을 선택해 주세요.
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="px-6 py-10 text-center text-sm text-dark-gray">
        불러오는 중…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 px-6 py-10 text-center">
        <p className="text-sm text-brand-red">
          {error instanceof Error
            ? error.message
            : "목록을 불러오지 못했습니다."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-medium text-neutral-900 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto pb-8 pl-6 pr-6">
      <button
        type="button"
        onClick={openCreate}
        disabled={isCreating}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red py-3 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95 active:opacity-90 disabled:opacity-60"
      >
        <BookmarkPlus className="size-6 shrink-0" strokeWidth={2.2} />
        새 북마크 추가
      </button>

      <div className="rounded-2xl border border-gray-border bg-white">
        {folders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-dark-gray">
            북마크가 없습니다. 위 버튼으로 추가해 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-gray-border">
            {folders.map((folder) => (
              <li key={folder.id}>
                <div className="flex items-center gap-3 px-4 py-4">
                  <Link
                    href={bookmarkFolderPath(folder.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none ring-brand-red focus-visible:ring-2"
                  >
                    <FolderRibbonIcon color={folder.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-neutral-900">
                        {folder.title}
                      </p>
                      <p className="mt-0.5 text-sm text-dark-gray">
                        {folder.placeCount ?? folder.places.length}개 장소
                      </p>
                    </div>
                  </Link>
                  <div
                    className="relative shrink-0"
                    ref={menuOpenId === folder.id ? menuRef : null}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setMenuOpenId((id) =>
                          id === folder.id ? null : folder.id,
                        )
                      }
                      disabled={isRowDeleting(folder.id)}
                      className="rounded-lg p-2 text-dark-gray transition-colors hover:bg-bubble-gray disabled:opacity-50"
                      aria-label="메뉴"
                    >
                      <MoreHorizontal className="size-5" />
                    </button>
                    {menuOpenId === folder.id && (
                      <div
                        className="absolute right-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-gray-border bg-white py-1 shadow-lg"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-4 py-2 text-left text-sm text-brand-red hover:bg-red-50 disabled:opacity-50"
                          disabled={isRowDeleting(folder.id)}
                          onClick={() => handleDelete(folder)}
                        >
                          {isRowDeleting(folder.id) ? "삭제 중…" : "삭제"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <AddBookmarkModal
          key={modalKey}
          mode="create"
          initialFolder={null}
          busy={isCreating}
          onClose={() => {
            setModalOpen(false);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
