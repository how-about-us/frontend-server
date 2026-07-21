import { describe, expect, it } from "vitest";

import { createAnalyticsConsentActions } from "@/lib/analytics/consent-actions";

describe("createAnalyticsConsentActions", () => {
  it("grants through the shared store without revoke side effects", () => {
    const order: string[] = [];
    const actions = createAnalyticsConsentActions({
      clearCookies: () => order.push("clear"),
      revokeGoogleAnalytics: () => order.push("revoke"),
      setConsent: (value) => {
        order.push(`set:${value}`);
        return { persisted: true, state: value };
      },
    });

    expect(actions.grant()).toEqual({ persisted: true, state: "granted" });
    expect(order).toEqual(["set:granted"]);
  });

  it("revokes GA before publishing denied state and clears cookies last", () => {
    const order: string[] = [];
    const actions = createAnalyticsConsentActions({
      clearCookies: () => order.push("clear"),
      revokeGoogleAnalytics: () => order.push("revoke"),
      setConsent: (value) => {
        order.push(`set:${value}`);
        return { persisted: true, state: value };
      },
    });

    expect(actions.deny()).toEqual({ persisted: true, state: "denied" });
    expect(order).toEqual(["revoke", "set:denied", "clear"]);
  });
});
