import { cn } from "@/lib/utils";

/** 기본: 앱 primary(red/white). active: 흰 배경 + red ring으로 선택 구분 */
export function mapChipButtonClassName(active: boolean) {
  return cn(
    "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition-[background-color,color,opacity,box-shadow] duration-200",
    active
      ? "bg-white text-brand-red ring-2 ring-brand-red ring-offset-1 hover:bg-gray-50 active:opacity-90"
      : "bg-brand-red text-white hover:opacity-95 active:opacity-90",
  );
}
