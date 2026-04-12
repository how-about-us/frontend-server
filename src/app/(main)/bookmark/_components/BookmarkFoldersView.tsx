"use client";

import { BookmarkPlus, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BookmarkFolder } from "@/mocks";
import { useBookmarkFolders } from "../context";
import { bookmarkFolderPath } from "../routes";
import { AddBookmarkModal } from "./AddBookmarkModal";
import { FolderRibbonIcon } from "./FolderRibbonIcon";

function newFolderId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `bf-${Date.now()}`;
}

export function BookmarkFoldersView() {
  const { folders, setFolders } = useBookmarkFolders();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingFolder, setEditingFolder] = useState<BookmarkFolder | null>(
    null,
  );
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
    setModalMode("create");
    setEditingFolder(null);
    setModalOpen(true);
  };

  const openEdit = (folder: BookmarkFolder) => {
    closeMenu();
    setModalKey((k) => k + 1);
    setModalMode("edit");
    setEditingFolder(folder);
    setModalOpen(true);
  };

  const handleSave = ({ title, color }: { title: string; color: string }) => {
    if (modalMode === "edit" && editingFolder) {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === editingFolder.id ? { ...f, title, color } : f,
        ),
      );
    } else {
      setFolders((prev) => [
        ...prev,
        { id: newFolderId(), title, color, places: [] },
      ]);
    }
    setModalOpen(false);
    setEditingFolder(null);
  };

  const handleDelete = (id: string) => {
    closeMenu();
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4 overflow-y-auto pb-8 pl-6 pr-6">
      <button
        type="button"
        onClick={openCreate}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red py-3 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95 active:opacity-90"
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
                        {folder.places.length}개 장소
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
                      className="rounded-lg p-2 text-dark-gray transition-colors hover:bg-bubble-gray"
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
                          className="block w-full px-4 py-2 text-left text-sm text-neutral-900 hover:bg-bubble-gray"
                          onClick={() => openEdit(folder)}
                        >
                          편집
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-4 py-2 text-left text-sm text-brand-red hover:bg-red-50"
                          onClick={() => handleDelete(folder.id)}
                        >
                          삭제
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
          mode={modalMode}
          initialFolder={editingFolder}
          onClose={() => {
            setModalOpen(false);
            setEditingFolder(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
