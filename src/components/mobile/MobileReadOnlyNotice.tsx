"use client";

import { usePathname } from "next/navigation";

import { useMobileView } from "@/contexts/MobileViewContext";
import {
  isMobileReadOnlyNoticeRoute,
  mobileReadOnlyNoticeMessage,
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
      className="shrink-0 border-b border-brand-red/20 bg-brand-red/[0.06] px-3 py-2.5 text-center text-[14px] leading-relaxed text-muted-brown"
    >
      {mobileReadOnlyNoticeMessage}
    </div>
  );
}
