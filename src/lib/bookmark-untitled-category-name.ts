/** 빈 제목으로 저장할 때 쓰는 기본 라벨(뒤에 ` 1`, ` 2` … 붙여 중복 회피) */
export const UNTITLED_BOOKMARK_CATEGORY_LABEL = "제목 없는 북마크";

/**
 * `existingNames`와 겹치지 않는 무제목 카테고리 이름.
 * 먼저 기본 라벨, 이미 있으면 `제목 없는 북마크 1`, `2`, … 순으로 선택합니다.
 */
export function pickUniqueUntitledBookmarkCategoryName(
  existingNames: string[],
): string {
  const taken = new Set(
    existingNames.map((n) => n.trim()).filter((n) => n.length > 0),
  );
  const base = UNTITLED_BOOKMARK_CATEGORY_LABEL;
  if (!taken.has(base)) return base;
  let n = 1;
  while (taken.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}
