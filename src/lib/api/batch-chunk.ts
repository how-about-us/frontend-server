/** 벌크 API 요청 본문을 서버 한도에 맞게 분할합니다. */
export function chunkArray<T>(items: readonly T[], maxSize: number): T[][] {
  const max = Math.max(1, Math.floor(maxSize));
  if (items.length <= max) return items.length ? [items.slice() as T[]] : [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += max) {
    chunks.push(items.slice(i, i + max));
  }
  return chunks;
}

export const PLACE_BATCH_MAX_SIZE = 100;
export const SCHEDULE_ROUTES_BATCH_MAX_SIZE = 25;
