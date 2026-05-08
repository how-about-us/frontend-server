import { MAP_PIN_BODY_PATH } from "./MapPinIconWithoutCircle";

export function MapPinIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 핀 몸체 (Path) */}
      <path d={MAP_PIN_BODY_PATH} fill={color} />
      {/* 내부 흰색 원 (Circle) */}
      <circle
        cx="50"
        cy="35"
        r="15"
        stroke="white"
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}
