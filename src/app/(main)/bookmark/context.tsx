"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useBookmarkCategories } from "@/hooks/useRooms";
import type { BookmarkCategory } from "@/lib/api/rooms";
import { useSessionStore } from "@/stores/session-store";
import type { BookmarkFolder } from "@/types/bookmark";

type BookmarkFoldersContextValue = {
  folders: BookmarkFolder[];
  setFolders: React.Dispatch<React.SetStateAction<BookmarkFolder[]>>;
};

const BookmarkFoldersContext = createContext<BookmarkFoldersContextValue | null>(
  null,
);

function categoryToFolder(
  c: BookmarkCategory,
  prevPlacesById: Map<string, BookmarkFolder["places"]>,
): BookmarkFolder {
  const id = String(c.categoryId);
  return {
    id,
    title: c.name,
    color: c.colorCode,
    places: prevPlacesById.get(id) ?? [],
    placeCount: c.placeCount,
  };
}

export function BookmarkFoldersProvider({ children }: { children: ReactNode }) {
  const roomId = useSessionStore((s) => s.currentRoomId);
  const { data } = useBookmarkCategories(roomId);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);

  useEffect(() => {
    if (!roomId) {
      setFolders([]);
      return;
    }
    if (!data) {
      setFolders([]);
      return;
    }
    setFolders((prev) => {
      const prevPlacesById = new Map(prev.map((f) => [f.id, f.places]));
      return data.map((c) => categoryToFolder(c, prevPlacesById));
    });
  }, [data, roomId]);

  const value = useMemo(() => ({ folders, setFolders }), [folders]);
  return (
    <BookmarkFoldersContext.Provider value={value}>
      {children}
    </BookmarkFoldersContext.Provider>
  );
}

export function useBookmarkFolders() {
  const ctx = useContext(BookmarkFoldersContext);
  if (!ctx) {
    throw new Error("useBookmarkFolders must be used under BookmarkFoldersProvider");
  }
  return ctx;
}
