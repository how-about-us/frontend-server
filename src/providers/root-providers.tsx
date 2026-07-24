"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

import { AnonymousAnalyticsRouteTracker } from "@/components/analytics/AnonymousAnalyticsRouteTracker";
import { ConsentGatedAnalytics } from "@/components/analytics/ConsentGatedAnalytics";
import { MobileChrome } from "@/components/mobile/MobileChrome";
import { analyticsRuntime } from "@/lib/analytics/runtime";

const PROVIDER_FREE_PUBLIC_PATHS = new Set(["/", "/login"]);

const FullAppProviderStack = dynamic(() =>
  import("@/providers/full-app-provider-stack").then(
    (module) => module.FullAppProviderStack,
  ),
);

function LightweightPublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileChrome>{children}</MobileChrome>
      {analyticsRuntime.enabled && analyticsRuntime.measurementId ? (
        <ConsentGatedAnalytics
          debugMode={analyticsRuntime.debugMode}
          gaId={analyticsRuntime.measurementId}
        >
          <AnonymousAnalyticsRouteTracker />
        </ConsentGatedAnalytics>
      ) : null}
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export function AppRootProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      document.documentElement.classList.toggle("dark", media.matches);
    };

    apply();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }

    media.addListener(apply);
    return () => media.removeListener(apply);
  }, []);

  if (PROVIDER_FREE_PUBLIC_PATHS.has(pathname)) {
    return <LightweightPublicShell>{children}</LightweightPublicShell>;
  }

  return <FullAppProviderStack>{children}</FullAppProviderStack>;
}
