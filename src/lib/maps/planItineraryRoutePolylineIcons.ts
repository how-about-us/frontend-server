/// <reference types="google.maps" />

/**
 * 플랜 일정 구간 라인 진행 표시 (`SymbolPath.FORWARD_CLOSED_ARROW` = 3).
 * SSR·모듈 로드 시점에 전역 `google` 없이 쓰이도록 path 는 숫자 상수입니다.
 */
export const PLAN_ITINERARY_ROUTE_ARROW_ICONS: google.maps.IconSequence[] = [
  {
    icon: {
      path: 3 satisfies google.maps.SymbolPath,
      fillColor: "#ffffff",
      fillOpacity: 0.96,
      strokeColor: "#d61f25",
      strokeOpacity: 0.95,
      strokeWeight: 1.5,
      scale: 3,
    },
    repeat: "70px",
  },
];
