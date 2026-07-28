/** 맵 북마크·일차·일반 핀 공통 크기·테두리 */
export const MAP_PIN_DISPLAY_SIZE_PX = 42;
/** 선택된 장소 마커 — 일반 핀보다 약간 크게 */
export const MAP_PIN_SELECTED_DISPLAY_SIZE_PX = 50;

export const MAP_PIN_BORDER_STROKE = "#ffffff";

/** Lucide 북마크 아이콘(24×24 viewBox) strokeWidth */
export const MAP_PIN_BORDER_STROKE_WIDTH = 2.5;

const LUCIDE_ICON_VIEWBOX = 24;
const MAP_PIN_BODY_VIEWBOX = 100;

/** `MapPinIcon` / `MapPinIconWithoutCircle`(100×100 viewBox) — Lucide 2.5와 동일한 화면 두께 */
export const MAP_PIN_BODY_STROKE_WIDTH =
  MAP_PIN_BORDER_STROKE_WIDTH * (MAP_PIN_BODY_VIEWBOX / LUCIDE_ICON_VIEWBOX);

export const mapPinBodyBorderProps = {
  stroke: MAP_PIN_BORDER_STROKE,
  strokeWidth: MAP_PIN_BODY_STROKE_WIDTH,
} as const;
