"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "row" | "header";

const ICON_BORDER_STROKE = "#e5e7eb";

export function FolderRibbonIcon({
  color,
  className,
  variant = "row",
}: {
  color: string;
  className?: string;
  variant?: Variant;
}) {
  const header = variant === "header";
  return (
    <Bookmark
      className={cn(header ? "size-10" : "size-8", "shrink-0", className)}
      fill={color}
      color={ICON_BORDER_STROKE}
      strokeWidth={2}
      aria-hidden
    />
  );
}
