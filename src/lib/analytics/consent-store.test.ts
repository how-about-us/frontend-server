import { describe, expect, it, vi } from "vitest";

import { createAnalyticsConsentStore } from "@/lib/analytics/consent-store";

describe("createAnalyticsConsentStore", () => {
  it("reads persisted state and notifies subscribers after a choice", () => {
    let persisted: "granted" | "denied" | null = "granted";
    const listener = vi.fn();
    const store = createAnalyticsConsentStore({
      read: () => persisted,
      write: (value) => {
        persisted = value;
        return true;
      },
    });
    const unsubscribe = store.subscribe(listener);

    expect(store.getSnapshot()).toBe("granted");
    expect(store.set("denied")).toEqual({ persisted: true, state: "denied" });
    expect(store.getSnapshot()).toBe("denied");
    expect(store.isGranted()).toBe(false);
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
  });

  it("keeps the current tab denied when cookie persistence fails", () => {
    const store = createAnalyticsConsentStore({
      read: () => "granted",
      write: () => false,
    });

    expect(store.set("denied")).toEqual({ persisted: false, state: "denied" });
    expect(store.getSnapshot()).toBe("denied");
  });

  it("uses pending for server rendering", () => {
    const store = createAnalyticsConsentStore({
      read: () => "granted",
      write: () => true,
    });
    expect(store.getServerSnapshot()).toBe("pending");
  });
});
