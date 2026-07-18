import type { ImgHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { brandAssets } from "@/lib/public-assets";

const LOGO_INTRINSIC_WIDTH = 58;
const LOGO_INTRINSIC_HEIGHT = 40;
const FAVICON_DISPLAY_SIZE = 36;

export type BrandLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  variant?: "logo" | "favicon";
};

/**
 * 앱 공식 로고 SVG — Safari 호환을 위해 네이티브 `<img>` 사용.
 * `favicon` variant는 헤더 등 compact 영역용.
 */
export function BrandLogo({
  alt,
  className,
  style,
  variant = "logo",
  ...rest
}: BrandLogoProps) {
  const isFavicon = variant === "favicon";
  const width = isFavicon ? FAVICON_DISPLAY_SIZE : LOGO_INTRINSIC_WIDTH;
  const height = isFavicon ? FAVICON_DISPLAY_SIZE : LOGO_INTRINSIC_HEIGHT;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local brand asset; Safari-safe
    <img
      src={isFavicon ? brandAssets.favicon : brandAssets.logo}
      alt={alt}
      width={width}
      height={height}
      decoding="async"
      className={cn("block shrink-0", isFavicon && "rounded-lg", className)}
      style={{
        width,
        height,
        ...style,
      }}
      {...rest}
    />
  );
}
