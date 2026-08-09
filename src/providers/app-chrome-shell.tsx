import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { ConsentGatedAnalytics } from "@/components/analytics/ConsentGatedAnalytics";
import { MobileChrome } from "@/components/mobile/MobileChrome";
import { analyticsRuntime } from "@/lib/analytics/runtime";

export function AppChromeShell({
  analytics,
  children,
}: {
  analytics: ReactNode;
  children: ReactNode;
}) {
  const gaId =
    analyticsRuntime.enabled && analyticsRuntime.measurementId
      ? analyticsRuntime.measurementId
      : "";

  return (
    <>
      <MobileChrome>{children}</MobileChrome>
      <ConsentGatedAnalytics
        debugMode={analyticsRuntime.debugMode}
        gaId={gaId}
      >
        {analytics}
      </ConsentGatedAnalytics>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
