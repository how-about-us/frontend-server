import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MainPageHeaderProps = {
  title: string;
  description?: ReactNode;
  className?: string;
};

/** (main) 내부 페이지 좌측 상단 제목과 선택적 설명 문구 */
export function MainPageHeader({
  title,
  description,
  className,
}: MainPageHeaderProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <h1 className="text-lg font-bold text-black">{title}</h1>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-dark-gray">
          {description}
        </p>
      ) : null}
    </div>
  );
}
