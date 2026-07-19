import { describe, expect, it } from "vitest";

import {
  analyticsEntryPoint,
  analyticsPagePath,
  bucketItemCount,
  bucketMemberCount,
  bucketResultCount,
  bucketSearchRank,
  bucketTripDays,
  toAnalyticsRoomRole,
} from "@/lib/analytics/context";

describe("analytics context", () => {
  it.each([
    [0, "0"],
    [1, "1"],
    [2, "2"],
    [3, "3_4"],
    [4, "3_4"],
    [5, "5_plus"],
  ] as const)("buckets %i room members as %s", (count, expected) => {
    expect(bucketMemberCount(count)).toBe(expected);
  });

  it.each([
    [0, "0"],
    [1, "1"],
    [2, "2_3"],
    [3, "2_3"],
    [4, "4_7"],
    [7, "4_7"],
    [8, "8_plus"],
  ] as const)("buckets %i itinerary items as %s", (count, expected) => {
    expect(bucketItemCount(count)).toBe(expected);
  });

  it.each([
    [0, "0"],
    [1, "1_5"],
    [5, "1_5"],
    [6, "6_20"],
    [20, "6_20"],
    [21, "21_plus"],
  ] as const)("buckets %i search results as %s", (count, expected) => {
    expect(bucketResultCount(count)).toBe(expected);
  });

  it.each([
    [0, "1_3"],
    [2, "1_3"],
    [3, "4_10"],
    [9, "4_10"],
    [10, "11_plus"],
  ] as const)("buckets zero-based rank %i as %s", (index, expected) => {
    expect(bucketSearchRank(index)).toBe(expected);
  });

  it("calculates inclusive trip-day buckets", () => {
    expect(bucketTripDays("2026-07-19", "2026-07-19")).toBe("1");
    expect(bucketTripDays("2026-07-19", "2026-07-21")).toBe("2_3");
    expect(bucketTripDays("2026-07-19", "2026-07-25")).toBe("4_7");
    expect(bucketTripDays("2026-07-19", "2026-07-26")).toBe("8_plus");
  });

  it("omits trip-day buckets for missing or invalid ranges", () => {
    expect(bucketTripDays(null, "2026-07-19")).toBeUndefined();
    expect(bucketTripDays("invalid", "2026-07-19")).toBeUndefined();
    expect(bucketTripDays("2026-07-20", "2026-07-19")).toBeUndefined();
  });

  it("never includes URL query parameters in the analytics page path", () => {
    expect(analyticsPagePath("/search?q=home&inviteCode=secret")).toBe("/search");
    expect(analyticsPagePath("/join/code#details")).toBe("/join/code");
  });

  it("derives low-cardinality entry points and room roles", () => {
    expect(analyticsEntryPoint("invite-code")).toBe("invite");
    expect(analyticsEntryPoint(null)).toBe("direct");
    expect(toAnalyticsRoomRole("HOST")).toBe("host");
    expect(toAnalyticsRoomRole("MEMBER")).toBe("member");
  });
});
