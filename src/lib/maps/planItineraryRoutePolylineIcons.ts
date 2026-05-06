/// <reference types="google.maps" />

/**
 * 폴리라인顶点 인덱스 **감소** 방향을 가리키는 닫힌 화살표 (`SymbolPath.BACKWARD_CLOSED_ARROW` = 0).
 * 즉 배열 마지막 점 쪽에서 첫 점 쪽으로 진행하는 것처럼 보입니다.
 * SSR·모듈 로드 시점에 전역 `google` 없이 쓰이도록 path 는 숫자 상수입니다.
 */
export const PLAN_ITINERARY_ROUTE_ARROW_ICONS: google.maps.IconSequence[] = [
  {
    icon: {
      path: 1 satisfies google.maps.SymbolPath,
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
