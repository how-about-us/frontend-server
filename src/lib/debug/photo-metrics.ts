/**
 * [임시 계측] GCP Photo 비용 원인 분석용 브라우저 카운터.
 *
 * 측정이 끝나면 chore/gcp-photo-metrics 브랜치와 함께 폐기합니다.
 *
 * 브라우저 콘솔에서:
 *   __photoMetrics.table()   집계 표 출력
 *   __photoMetrics.repeats() 2회 이상 네트워크 요청된 photoName만 출력
 *   __photoMetrics.reset()   카운터 초기화
 */

const PREFIX = "[PHOTO-METRIC]";

export type PhotoMetricKind =
  | "photoUrl"
  | "photoUrlsBatch"
  | "photoNames"
  | "photoNamesBatch"
  | "previewsBatch";

type Counter = Record<string, number>;

type PhotoMetricsState = {
  /** 엔드포인트별 네트워크 요청(HTTP) 횟수 */
  requests: Counter;
  /** 엔드포인트별로 서버에 실제 보낸 항목 수 */
  items: Counter;
  /** React Query 캐시가 막아준 항목 수 */
  cacheHits: Counter;
  /** photoName별 네트워크 요청 횟수 */
  byPhotoName: Counter;
};

function emptyState(): PhotoMetricsState {
  return { requests: {}, items: {}, cacheHits: {}, byPhotoName: {} };
}

let state: PhotoMetricsState = emptyState();

function bump(counter: Counter, key: string, amount = 1): number {
  counter[key] = (counter[key] ?? 0) + amount;
  return counter[key];
}

function totalOf(counter: Counter): number {
  return Object.values(counter).reduce((sum, value) => sum + value, 0);
}

/** 2회 이상 네트워크로 나간 photoName — 프론트 캐시가 놓친 건들 */
function repeatedPhotoNames(): Array<{ photoName: string; count: number }> {
  return Object.entries(state.byPhotoName)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([photoName, count]) => ({ photoName, count }));
}

function summary() {
  const distinct = Object.keys(state.byPhotoName).length;
  const photoRequests = totalOf(state.byPhotoName);
  return {
    requests: { ...state.requests },
    items: { ...state.items },
    cacheHits: { ...state.cacheHits },
    distinctPhotoNames: distinct,
    photoNameRequests: photoRequests,
    repeatedPhotoNames: repeatedPhotoNames().length,
  };
}

/** 실제로 네트워크로 나간 요청 1건을 기록합니다. */
export function countPhotoRequest(
  kind: PhotoMetricKind,
  itemCount: number,
  photoNames?: readonly string[],
): void {
  try {
    const requests = bump(state.requests, kind);
    bump(state.items, kind, itemCount);

    let repeated = 0;
    for (const raw of photoNames ?? []) {
      const name = typeof raw === "string" ? raw.trim() : "";
      if (!name.length) continue;
      if (bump(state.byPhotoName, name) > 1) repeated += 1;
    }

    const repeatNote = repeated > 0 ? ` REPEAT=${repeated}` : "";
    console.log(
      `${PREFIX} net   ${kind} items=${itemCount} n=${requests}${repeatNote}`,
      summary(),
    );
  } catch {
    // 계측 실패가 본 로직을 막지 않도록 무시
  }
}

/**
 * React Query 캐시 필터 결과를 기록합니다.
 * requested 중 missing만 네트워크로 나가므로 `requested - missing`이 캐시가 막아준 양입니다.
 */
export function countCacheFilter(
  scope: string,
  requested: number,
  missing: number,
): void {
  try {
    const hit = Math.max(0, requested - missing);
    const totalHit = bump(state.cacheHits, scope, hit);
    console.log(
      `${PREFIX} cache ${scope} requested=${requested} rqHit=${hit} miss=${missing} | totalHit=${totalHit}`,
    );
  } catch {
    // 무시
  }
}

function reset(): void {
  state = emptyState();
  console.log(`${PREFIX} reset`);
}

function table(): void {
  console.table(state.requests);
  console.table(state.items);
  console.table(state.cacheHits);
  console.log(`${PREFIX} summary`, summary());
}

function repeats(): void {
  const rows = repeatedPhotoNames();
  if (!rows.length) {
    console.log(`${PREFIX} 반복 요청된 photoName 없음`);
    return;
  }
  console.table(rows);
}

if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__photoMetrics = {
    state: () => state,
    summary,
    table,
    repeats,
    reset,
  };
}
