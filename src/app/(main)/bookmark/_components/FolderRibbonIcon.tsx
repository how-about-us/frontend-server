"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "row" | "header";

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
      className={cn(header ? "size-10" : "size-8", className)}
      fill={color}
      color="#FFFFFF"
      style={header ? undefined : { color }}
      aria-hidden
    />
  );
}
