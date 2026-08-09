import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/components/analytics/ConsentGatedAnalytics", () => ({
  ConsentGatedAnalytics: ({ children }: { children: ReactNode }) => (
    <div data-amplitude-root>{children}</div>
  ),
}));

vi.mock("@/components/mobile/MobileChrome", () => ({
  MobileChrome: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/analytics/runtime", () => ({
  analyticsRuntime: {
    debugMode: false,
    enabled: false,
    measurementId: null,
  },
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
}));

import { AppChromeShell } from "@/providers/app-chrome-shell";

it("keeps the Amplitude root mounted without GA configuration", () => {
  const html = renderToStaticMarkup(
    <AppChromeShell analytics={<div data-route-tracker />}>
      <main>content</main>
    </AppChromeShell>,
  );

  expect(html).toContain("data-amplitude-root");
  expect(html).toContain("data-route-tracker");
});
