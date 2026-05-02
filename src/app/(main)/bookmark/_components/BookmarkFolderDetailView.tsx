"use client";

import { useCallback, useState } from "react";
import { SearchResultCard } from "@/components/place";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import type { BookmarkFolder } from "@/types/bookmark";
import { useBookmarkFolders } from "../context";
import {
  movePlacesBetweenFolders,
  removePlacesFromFolder,
} from "../place-mutations";
import { BookmarkFolderDetailHeader } from "./BookmarkFolderDetailHeader";
import { EditBookmarkPlacesModal } from "./EditBookmarkPlacesModal";

const SCROLLBAR =
  "min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(0,0,0,0.2)_transparent]";

export function BookmarkFolderDetailView({ folder }: { folder: BookmarkFolder }) {
  const { folders, setFolders } = useBookmarkFolders();
  const { setSelectedPlace } = useSelectedPlace();
  const [placesModalOpen, setPlacesModalOpen] = useState(false);
  const [placesModalKey, setPlacesModalKey] = useState(0);

  const openPlacesEdit = useCallback(() => {
    setPlacesModalKey((k) => k + 1);
    setPlacesModalOpen(true);
  }, []);

  const handleRemovePlaces = useCallback(
    (placeIds: string[]) => {
      setFolders((prev) =>
        removePlacesFromFolder(prev, folder.id, new Set(placeIds)),
      );
    },
    [folder.id, setFolders],
  );

  const handleMovePlaces = useCallback(
    (targetFolderId: string, placeIds: string[]) => {
      setFolders((prev) =>
        movePlacesBetweenFolders(
          prev,
          folder.id,
          targetFolderId,
          new Set(placeIds),
        ),
      );
    },
    [folder.id, setFolders],
  );

  return (
    <>
      <BookmarkFolderDetailHeader folder={folder} onEditClick={openPlacesEdit} />
      <div className={SCROLLBAR}>
        {folder.places.map((row) => {
          const { id, ...card } = row;
          return (
            <SearchResultCard
              key={id}
              {...card}
              onClick={() => setSelectedPlace(card)}
            />
          );
        })}
      </div>

      {placesModalOpen && (
        <EditBookmarkPlacesModal
          key={placesModalKey}
          folder={folder}
          folders={folders}
          onClose={() => setPlacesModalOpen(false)}
          onRemovePlaces={handleRemovePlaces}
          onMovePlaces={handleMovePlaces}
        />
      )}
    </>
  );
}
