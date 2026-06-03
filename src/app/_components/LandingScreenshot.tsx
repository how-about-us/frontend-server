import Image from "next/image";

import type { LandingScreenshotSpec } from "@/lib/landing/landing-screenshots";
import { cn } from "@/lib/utils";

type Props = {
  screenshot: LandingScreenshotSpec;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function LandingScreenshot({
  screenshot,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 560px",
  className,
}: Props) {
  const image = (
    <Image
      src={screenshot.src}
      alt={screenshot.alt}
      width={screenshot.width}
      height={screenshot.height}
      priority={priority}
      sizes={sizes}
      unoptimized={process.env.NODE_ENV === "development"}
      className={cn("block h-auto w-full", className)}
    />
  );

  if (!screenshot.framed) {
    return image;
  }

  return (
    <div
      className={cn(
        "mx-auto w-full overflow-hidden rounded-xl border border-gray-border bg-white leading-none shadow-[0_16px_48px_-20px_rgba(15,23,42,0.15)]",
        screenshot.frameMaxWidthClass,
      )}
    >
      {image}
    </div>
  );
}
