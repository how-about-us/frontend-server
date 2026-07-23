import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pathname: "/",
  createQueryClient: vi.fn(() => ({ id: "query-client" })),
  registerQueryClient: vi.fn(),
  useQueryClient: vi.fn(() => ({ id: "query-client" })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClientProvider: ({ children }: { children: ReactNode }) => (
    <div data-provider="query-client">{children}</div>
  ),
  useQueryClient: mocks.useQueryClient,
}));

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => <div data-provider="query-devtools" />,
}));

vi.mock("sonner", () => ({
  Toaster: () => <div data-provider="toaster" />,
}));

vi.mock("@/components/analytics/ConsentGatedAnalytics", () => ({
  ConsentGatedAnalytics: ({ anonymous = false }: { anonymous?: boolean }) => (
    <div
      data-analytics-mode={anonymous ? "anonymous" : "session"}
      data-provider="analytics"
    />
  ),
}));

vi.mock("@/components/mobile/MobileChrome", () => ({
  MobileChrome: ({ children }: { children: ReactNode }) => (
    <div data-provider="mobile-chrome">{children}</div>
  ),
}));

vi.mock("@/components/google-maps-provider", () => ({
  GoogleMapsProvider: ({ children }: { children: ReactNode }) => (
    <div data-provider="google-maps">{children}</div>
  ),
}));

vi.mock("@/contexts/StompContext", () => ({
  StompProvider: ({ children }: { children: ReactNode }) => (
    <div data-provider="stomp">{children}</div>
  ),
}));

vi.mock("@/lib/analytics/runtime", () => ({
  analyticsRuntime: {
    debugMode: false,
    enabled: true,
    measurementId: "G-TEST",
  },
}));

vi.mock("@/lib/auth", () => ({
  reconcileClientSession: vi.fn(),
}));

vi.mock("@/lib/query-client", () => ({
  createQueryClient: mocks.createQueryClient,
  registerQueryClient: mocks.registerQueryClient,
}));

import { AppRootProviders } from "@/providers/root-providers";

function renderAt(pathname: string): string {
  mocks.pathname = pathname;
  return renderToStaticMarkup(
    <AppRootProviders>
      <main>route content</main>
    </AppRootProviders>,
  );
}

describe("AppRootProviders route boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    "/",
    "/product",
    "/login",
    "/terms",
    "/privacy",
    "/operations-policy",
    "/copyright-policy",
  ])("keeps the exact public path %s on the lightweight shell", (pathname) => {
    const html = renderAt(pathname);

    expect(html).toContain('data-provider="mobile-chrome"');
    expect(html).toContain('data-provider="analytics"');
    expect(html).toContain('data-analytics-mode="anonymous"');
    expect(html).toContain('data-provider="toaster"');
    expect(html).not.toContain('data-provider="query-client"');
    expect(html).not.toContain('data-provider="stomp"');
    expect(html).not.toContain('data-provider="google-maps"');
    expect(mocks.createQueryClient).not.toHaveBeenCalled();
    expect(mocks.useQueryClient).not.toHaveBeenCalled();
  });

  it.each(["/home", "/login/agreements"])(
    "retains the full app provider stack on %s",
    (pathname) => {
      const html = renderAt(pathname);

      expect(html).toContain('data-provider="query-client"');
      expect(html).toContain('data-provider="stomp"');
      expect(html).toContain('data-provider="google-maps"');
      expect(html).toContain('data-analytics-mode="session"');
      expect(mocks.createQueryClient).toHaveBeenCalledTimes(1);
      expect(mocks.useQueryClient).toHaveBeenCalledTimes(1);
    },
  );
});
