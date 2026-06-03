/** `MapPinIcon` 몸통 path — 원 없는 변형과 공유 */
export const MAP_PIN_BODY_PATH =
  "M50 95C50 95 85 60 85 35C85 15.67 69.33 0 50 0C30.67 0 15 15.67 15 35C15 60 50 95 50 95Z";

/** body stroke가 핀 꼭짓점에서 잘리지 않도록 viewBox 여백 포함 */
export const MAP_PIN_ICON_VIEW_BOX = "-8 -8 116 116";

const mapPinSvgProps = {
  viewBox: MAP_PIN_ICON_VIEW_BOX,
  fill: "none" as const,
  overflow: "visible" as const,
  xmlns: "http://www.w3.org/2000/svg",
};

export function MapPinIconWithoutCircle({
  size = 24,
  color = "currentColor",
  stroke,
  strokeWidth,
}: {
  size?: number;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} {...mapPinSvgProps}>
      <path
        d={MAP_PIN_BODY_PATH}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}
