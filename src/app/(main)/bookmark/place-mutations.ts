import type { BookmarkFolder } from "@/types/bookmark";

export function removePlacesFromFolder(
  folders: BookmarkFolder[],
  folderId: string,
  placeIds: ReadonlySet<string>,
): BookmarkFolder[] {
  return folders.map((f) =>
    f.id !== folderId
      ? f
      : { ...f, places: f.places.filter((p) => !placeIds.has(p.id)) },
  );
}

export function movePlacesBetweenFolders(
  folders: BookmarkFolder[],
  fromFolderId: string,
  toFolderId: string,
  placeIds: ReadonlySet<string>,
): BookmarkFolder[] {
  const from = folders.find((f) => f.id === fromFolderId);
  if (!from) return folders;
  const moved = from.places.filter((p) => placeIds.has(p.id));
  return folders.map((f) => {
    if (f.id === fromFolderId) {
      return { ...f, places: f.places.filter((p) => !placeIds.has(p.id)) };
    }
    if (f.id === toFolderId) {
      return { ...f, places: [...f.places, ...moved] };
    }
    return f;
  });
}
