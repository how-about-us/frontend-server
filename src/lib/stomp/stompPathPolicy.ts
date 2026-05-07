/** 승인 대기·초대 코드 처리 구간은 HTTP만 사용하고 WebSocket을 열지 않습니다. */
export function pathSuspendsStomp(pathname: string): boolean {
  return pathname === "/waiting" || pathname.startsWith("/join/");
}

/**
 * 룸 목록·새 여행 등 — `currentRoomId`가 있어도 방별 토픽은 구독하지 않습니다.
 * (`/user/queue/rooms` 등 연결 단위 구독은 그대로 둡니다.)
 */
export function pathDefersRoomStompRoomTopics(pathname: string): boolean {
  return pathname === "/home" || pathname.startsWith("/home/");
}
