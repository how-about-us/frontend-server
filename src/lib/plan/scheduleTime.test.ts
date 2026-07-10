import { describe, expect, it } from "vitest";

import {
  formatScheduleStaySummary,
  hasScheduleTimeDraftValue,
  validateScheduleTimeDraft,
} from "@/lib/plan/scheduleTime";

describe("validateScheduleTimeDraft", () => {
  it("rejects positive duration when start time is empty", () => {
    expect(validateScheduleTimeDraft("", 30)).toEqual({
      valid: false,
      message: "시작 시각 없이 체류 시간을 설정할 수 없어요.",
    });
  });

  it("allows zero duration when start time is empty", () => {
    expect(validateScheduleTimeDraft("", 0)).toEqual({ valid: true });
  });
});

describe("formatScheduleStaySummary", () => {
  it("does not treat duration alone as configured schedule time", () => {
    expect(formatScheduleStaySummary("", 30)).toBe("");
  });
});

describe("hasScheduleTimeDraftValue", () => {
  it("detects unsaved start time as a draft value", () => {
    expect(hasScheduleTimeDraftValue("09:00", "0")).toBe(true);
  });

  it("does not detect an empty draft as a value", () => {
    expect(hasScheduleTimeDraftValue("", "0")).toBe(false);
  });
});
