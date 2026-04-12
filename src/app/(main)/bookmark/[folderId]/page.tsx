"use client";

import { useParams, notFound } from "next/navigation";
import { useMemo } from "react";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { useBookmarkFolders } from "../context";
import { BookmarkFolderDetailView } from "../_components/BookmarkFolderDetailView";

export default function BookmarkFolderDetailPage() {
  const params = useParams();
  const folderId = typeof params.folderId === "string" ? params.folderId : "";
  const { folders } = useBookmarkFolders();

  const folder = useMemo(
    () => folders.find((f) => f.id === folderId),
    [folders, folderId],
  );

  if (!folderId || !folder) {
    notFound();
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-b border-gray-border">
      <SetSectionMaxWidth value="s1" />
      <BookmarkFolderDetailView folder={folder} />
    </div>
  );
}
