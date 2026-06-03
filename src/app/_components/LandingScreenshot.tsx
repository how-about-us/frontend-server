import Image from "next/image";

import type { LandingScreenshotSpec } from "@/lib/landing/landing-screenshots";
import { cn } from "@/lib/utils";

type Props = {
  screenshot: LandingScreenshotSpec;
  priority?: boolean;
  sizes?: string;
  className?: string;
  frameClassName?: string;
};

export function LandingScreenshot({
  screenshot,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 560px",
  className,
  frameClassName,
}: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-border bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18)]",
        frameClassName,
      )}
    >
      <Image
        src={screenshot.src}
        alt={screenshot.alt}
        width={screenshot.width}
        height={screenshot.height}
        priority={priority}
        sizes={sizes}
        className={cn("h-auto w-full", className)}
      />
    </div>
  );
}
