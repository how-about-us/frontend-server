"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { INITIAL_BOOKMARK_FOLDERS, type BookmarkFolder } from "@/mocks";

type BookmarkFoldersContextValue = {
  folders: BookmarkFolder[];
  setFolders: React.Dispatch<React.SetStateAction<BookmarkFolder[]>>;
};

const BookmarkFoldersContext = createContext<BookmarkFoldersContextValue | null>(
  null,
);

export function BookmarkFoldersProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<BookmarkFolder[]>(
    INITIAL_BOOKMARK_FOLDERS,
  );
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
