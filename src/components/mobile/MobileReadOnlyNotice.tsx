"use client";

import { Monitor } from "lucide-react";
import { usePathname } from "next/navigation";

import { useMobileView } from "@/contexts/MobileViewContext";
import {
  isMobileReadOnlyNoticeRoute,
  mobileReadOnlyNoticeCopy,
} from "@/lib/mobile-view";

export function MobileReadOnlyNotice() {
  const pathname = usePathname();
  const { isMobileDevice } = useMobileView();

  if (!isMobileDevice || !isMobileReadOnlyNoticeRoute(pathname)) {
    return null;
  }

  return (
    <div
      role="status"
      className="shrink-0 border-b border-brand-red/15 bg-brand-red/[0.06] px-4 py-3"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
          <Monitor size={14} strokeWidth={2.2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 leading-snug">
          <p className="text-[14px] font-semibold text-brand-red">
            {mobileReadOnlyNoticeCopy.title}
          </p>
          <p className="mt-0.5 text-[13px] text-muted-brown">
            {mobileReadOnlyNoticeCopy.description}
          </p>
        </div>
      </div>
    </div>
  );
}
