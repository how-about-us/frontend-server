export const BOOKMARK_LIST_PATH = "/bookmark";

export function bookmarkFolderPath(folderId: string) {
  return `${BOOKMARK_LIST_PATH}/${folderId}`;
}
