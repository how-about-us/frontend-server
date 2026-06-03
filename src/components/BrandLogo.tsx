import type { ImgHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { brandAssets } from "@/lib/public-assets";

const LOGO_SRC = brandAssets.logo;
const LOGO_INTRINSIC_WIDTH = 58;
const LOGO_INTRINSIC_HEIGHT = 40;

export type BrandLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src">;

/**
 * 앱 공식 `brand/logo.svg` — Safari 호환을 위해 네이티브 `<img>` 사용.
 * 표시 크기는 SVG 고유 비율(49×28)을 따릅니다.
 */
export function BrandLogo({ alt, className, style, ...rest }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG; Safari-safe
    <img
      src={LOGO_SRC}
      alt={alt}
      width={LOGO_INTRINSIC_WIDTH}
      height={LOGO_INTRINSIC_HEIGHT}
      decoding="async"
      className={cn("block shrink-0", className)}
      style={{
        width: LOGO_INTRINSIC_WIDTH,
        height: LOGO_INTRINSIC_HEIGHT,
        ...style,
      }}
      {...rest}
    />
  );
}
