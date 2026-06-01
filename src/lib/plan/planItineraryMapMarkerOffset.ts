/// <reference types="google.maps" />

export type PlanMapStopForOffset = {
  scheduleId: number;
  itemId: number;
  /** 일차 `places` 배열 내 0-based 순서 */
  orderIndex: number;
  location: google.maps.LatLngLiteral;
};

/**
 * 좌표를 소수 자릿수로 묶어 "같은 지점"으로 간주합니다 (약 1m 단위).
 */
const COORD_KEY_DECIMALS = 5;

function coordGroupKey(loc: google.maps.LatLngLiteral): string {
  return `${loc.lat.toFixed(COORD_KEY_DECIMALS)},${loc.lng.toFixed(COORD_KEY_DECIMALS)}`;
}

/**
 * 펼친 일차들 중 같은 좌표가 겹치면 **마지막으로 펼친 일차**(`expansionOrder` 뒤쪽)의
 * **마지막 순서 항목**(`orderIndex` 최대) 핀만 남깁니다. 좌표 스태거는 하지 않습니다.
 */
export function filterVisiblePlanMapStops(
  stops: PlanMapStopForOffset[],
  expansionOrder: readonly number[],
): PlanMapStopForOffset[] {
  const scheduleRank = new Map<number, number>();
  expansionOrder.forEach((id, idx) => {
    scheduleRank.set(id, idx);
  });

  const groups = new Map<string, PlanMapStopForOffset[]>();
  for (const s of stops) {
    const k = coordGroupKey(s.location);
    const g = groups.get(k) ?? [];
    g.push(s);
    groups.set(k, g);
  }

  const out: PlanMapStopForOffset[] = [];
  for (const group of groups.values()) {
    let best = group[0]!;
    for (let i = 1; i < group.length; i += 1) {
      const s = group[i]!;
      const bestRank = scheduleRank.get(best.scheduleId) ?? -1;
      const sRank = scheduleRank.get(s.scheduleId) ?? -1;
      if (
        sRank > bestRank ||
        (sRank === bestRank && s.orderIndex > best.orderIndex)
      ) {
        best = s;
      }
    }
    out.push(best);
  }
  return out;
}
