"use client";

import { BookmarkPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  useBookmarkCategories,
  useCreateBookmarkCategory,
} from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

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
