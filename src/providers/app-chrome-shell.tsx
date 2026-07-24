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
  return (
    <>
      <MobileChrome>{children}</MobileChrome>
      {analyticsRuntime.enabled && analyticsRuntime.measurementId ? (
        <ConsentGatedAnalytics
          debugMode={analyticsRuntime.debugMode}
          gaId={analyticsRuntime.measurementId}
        >
          {analytics}
        </ConsentGatedAnalytics>
      ) : null}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
