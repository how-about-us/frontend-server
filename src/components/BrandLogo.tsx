"use client";

import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.svg";

export type BrandLogoProps = Omit<
  ImageProps,
  "src" | "priority" | "width" | "height"
> & {
  width: number;
  height: number;
  /** 폴드 위 LCP 대비 — 기본 true */
  priority?: boolean;
};

/**
 * 앱 공식 `logo.svg`. 크기·alt 등은 호출부에서 두고, src·priority·비율 안정 스타일은 공통 처리.
 */
export function BrandLogo({
  alt,
  width,
  height,
  className,
  priority = true,
  style,
  ...rest
}: BrandLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn("shrink-0", className)}
      style={{
        width: "auto",
        height: "auto",
        ...style,
      }}
      {...rest}
    />
  );
}
