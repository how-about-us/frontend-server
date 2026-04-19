export function MapPinIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100" // 원본 비율에 맞춘 뷰박스
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 핀 몸체 (Path) */}
      <path
        d="M50 95C50 95 85 60 85 35C85 15.67 69.33 0 50 0C30.67 0 15 15.67 15 35C15 60 50 95 50 95Z"
        fill={color}
      />
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
