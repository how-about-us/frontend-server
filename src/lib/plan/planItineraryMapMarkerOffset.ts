/// <reference types="google.maps" />

export type PlanMapStopForOffset = {
  scheduleId: number;
  itemId: number;
  location: google.maps.LatLngLiteral;
};

/**
 * 좌표를 소수 자릿수로 묶어 "같은 지점"으로 간주합니다 (약 1m 단위).
 */
const COORD_KEY_DECIMALS = 5;

const STAGGER_METERS_EAST = 200;

function coordGroupKey(loc: google.maps.LatLngLiteral): string {
  return `${loc.lat.toFixed(COORD_KEY_DECIMALS)},${loc.lng.toFixed(COORD_KEY_DECIMALS)}`;
}

/**
 * 일정 지도에서 서로 다른 일차·항목이 같은 좌표를 쓰면 핀이 겹칩니다.
 * 동일 그룹은 경도 방향으로만 살짝 벌려 표시용 좌표를 만듭니다 (실제 장소 좌표는 그대로 유지).
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
      const id = `${s.scheduleId}-${s.itemId}`;
      if (n === 1) {
        out.set(id, s.location);
        continue;
      }
      const metersEast = (i - (n - 1) / 2) * STAGGER_METERS_EAST;
      const lat = s.location.lat;
      const cosLat = Math.cos((lat * Math.PI) / 180);
      const deltaLng = metersEast / (111_320 * Math.max(0.2, cosLat));
      out.set(id, { lat, lng: s.location.lng + deltaLng });
    }
  }

  return out;
}
