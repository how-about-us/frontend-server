/// <reference types="google.maps" />

export type PlanMapStopForOffset = {
  scheduleId: number;
  itemId: number;
  /** 일차 `places` 배열 내 0-based 순서 — 같은 좌표 dedupe 시 마지막 항목 선택용 */
  orderIndex: number;
  location: google.maps.LatLngLiteral;
};

/**
 * 좌표를 소수 자릿수로 묶어 "같은 지점"으로 간주합니다 (약 1m 단위).
 */
const COORD_KEY_DECIMALS = 5;

/** 서로 다른 일차가 같은 좌표일 때 표시용 경도 스태거 (기존 200m 대비 축소) */
const STAGGER_METERS_EAST_CROSS_SCHEDULE = 50;

function coordGroupKey(loc: google.maps.LatLngLiteral): string {
  return `${loc.lat.toFixed(COORD_KEY_DECIMALS)},${loc.lng.toFixed(COORD_KEY_DECIMALS)}`;
}

function scheduleCoordKey(
  scheduleId: number,
  loc: google.maps.LatLngLiteral,
): string {
  return `${scheduleId}:${coordGroupKey(loc)}`;
}

function stopId(s: PlanMapStopForOffset): string {
  return `${s.scheduleId}-${s.itemId}`;
}

/**
 * 같은 일차·같은 좌표 — 리스트에서 **마지막 순서**(`orderIndex` 최대) 항목만 남깁니다.
 * `displayPositionsForOverlappingStops` 호출 전에 적용합니다.
 */
export function filterVisiblePlanMapStops(
  stops: PlanMapStopForOffset[],
): PlanMapStopForOffset[] {
  const groups = new Map<string, PlanMapStopForOffset[]>();
  for (const s of stops) {
    const k = scheduleCoordKey(s.scheduleId, s.location);
    const g = groups.get(k) ?? [];
    g.push(s);
    groups.set(k, g);
  }

  const out: PlanMapStopForOffset[] = [];
  for (const group of groups.values()) {
    let best = group[0]!;
    for (let i = 1; i < group.length; i += 1) {
      const s = group[i]!;
      if (s.orderIndex > best.orderIndex) best = s;
    }
    out.push(best);
  }
  return out;
}

/**
 * 일차별 대표 stop끼리 같은 좌표면 경도 방향으로만 살짝 벌립니다 (실제 장소 좌표는 유지).
 * 입력은 `filterVisiblePlanMapStops` 결과만 사용합니다.
 */
export function displayPositionsForOverlappingStops(
  stops: PlanMapStopForOffset[],
): Map<string, google.maps.LatLngLiteral> {
  const groups = new Map<string, PlanMapStopForOffset[]>();
  for (const s of stops) {
    const k = coordGroupKey(s.location);
    const g = groups.get(k) ?? [];
    g.push(s);
    groups.set(k, g);
  }

  const out = new Map<string, google.maps.LatLngLiteral>();

  for (const group of groups.values()) {
    group.sort((a, b) => a.scheduleId - b.scheduleId || a.itemId - b.itemId);
    const n = group.length;
    for (let i = 0; i < n; i += 1) {
      const s = group[i]!;
      const id = stopId(s);
      if (n === 1) {
        out.set(id, s.location);
        continue;
      }
      const metersEast = (i - (n - 1) / 2) * STAGGER_METERS_EAST_CROSS_SCHEDULE;
      const lat = s.location.lat;
      const cosLat = Math.cos((lat * Math.PI) / 180);
      const deltaLng = metersEast / (111_320 * Math.max(0.2, cosLat));
      out.set(id, { lat, lng: s.location.lng + deltaLng });
    }
  }

  return out;
}
