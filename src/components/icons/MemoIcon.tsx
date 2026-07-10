import type { SVGProps } from "react";

/** 우측 하단 접힘 스티키 노트 — 플랜 카드 메모 트리거/모듈 아이콘 */
export function MemoIcon({
  className,
  strokeWidth = 2,
  ...rest
}: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d="M6 4h12a2 2 0 0 1 2 2v9l-5 5H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M20 15h-3a2 2 0 0 0-2 2v3" />
    </svg>
  );
}
