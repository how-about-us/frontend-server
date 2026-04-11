/**
 * 장소 id 쌍에 대한 목 이동 시간(분). 실제 서비스에서는 경로 API 등으로 대체한다.
 * 순서가 바뀌어도 동일한 두 장소 사이는 같은 소요 시간을 쓴다(무방향).
 */
const MINUTES_BY_PAIR: Record<string, number> = {
  "1|2": 25,
  "1|3": 42,
  "2|3": 18,
  "4|5": 22,
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

export function getMockTravelMinutes(fromId: string, toId: string): number {
  if (fromId === toId) return 0;
  return MINUTES_BY_PAIR[pairKey(fromId, toId)] ?? 24;
}
