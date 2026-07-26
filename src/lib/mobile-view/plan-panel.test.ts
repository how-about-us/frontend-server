import { describe, expect, it } from "vitest";

import {
  buildMobilePlanPanelHref,
  MOBILE_PLAN_PANEL_ORDER,
  readMobilePlanPanel,
} from "./plan-panel";

describe("mobile plan panel routing", () => {
  it("defaults unknown query values to the schedule panel", () => {
    expect(readMobilePlanPanel(null)).toBe("schedule");
    expect(readMobilePlanPanel("")).toBe("schedule");
    expect(readMobilePlanPanel("places")).toBe("schedule");
  });

  it("accepts map and chat query values", () => {
    expect(readMobilePlanPanel("map")).toBe("map");
    expect(readMobilePlanPanel("chat")).toBe("chat");
  });

  it("orders mobile plan panels as chat, schedule, map", () => {
    expect(MOBILE_PLAN_PANEL_ORDER).toEqual(["chat", "schedule", "map"]);
  });

  it("keeps the current plan room path when building panel links", () => {
    expect(buildMobilePlanPanelHref("/plan/room-1", "schedule")).toBe(
      "/plan/room-1",
    );
    expect(buildMobilePlanPanelHref("/plan/room-1", "map")).toBe(
      "/plan/room-1?view=map",
    );
    expect(buildMobilePlanPanelHref("/plan/room-1", "chat")).toBe(
      "/plan/room-1?view=chat",
    );
  });

  it("falls back to /plan outside plan routes", () => {
    expect(buildMobilePlanPanelHref("/bookmark", "map")).toBe(
      "/plan?view=map",
    );
  });
});
