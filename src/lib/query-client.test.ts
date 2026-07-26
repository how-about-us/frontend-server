import { afterEach, describe, expect, it, vi } from "vitest";

describe("getOrCreateQueryClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("reuses the browser QueryClient after the provider stack remounts", async () => {
    vi.resetModules();
    vi.stubGlobal("window", {});

    const queryClientModule = await import("@/lib/query-client");

    expect(queryClientModule.getOrCreateQueryClient).toBeTypeOf("function");

    const first = queryClientModule.getOrCreateQueryClient();
    const second = queryClientModule.getOrCreateQueryClient();

    expect(second).toBe(first);
    expect(queryClientModule.getQueryClient()).toBe(first);
  });
});
