/** `MapPinIcon` 몸통 path — 원 없는 변형과 공유 */
export const MAP_PIN_BODY_PATH =
  "M50 95C50 95 85 60 85 35C85 15.67 69.33 0 50 0C30.67 0 15 15.67 15 35C15 60 50 95 50 95Z";

export function MapPinIconWithoutCircle({
  size = 24,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={MAP_PIN_BODY_PATH} fill={color} />
    </svg>
  );
}
