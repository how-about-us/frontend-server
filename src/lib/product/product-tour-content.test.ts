import { describe, expect, it } from "vitest";

import {
  PRODUCT_TOUR_FLOW,
  PRODUCT_TOUR_STEPS,
} from "@/lib/product/product-tour-content";

describe("product tour content", () => {
  it("keeps the complete product flow in review order", () => {
    expect(PRODUCT_TOUR_FLOW).toEqual([
      "방 생성",
      "장소 탐색",
      "장소 공유와 대화",
      "일정 구성",
      "AI 활용",
    ]);
    expect(PRODUCT_TOUR_STEPS.map((step) => step.screenshotKey)).toEqual([
      "map",
      "placeShare",
      "chat",
      "plan",
      "ai",
    ]);
    expect(PRODUCT_TOUR_STEPS.map((step) => step.layout)).toEqual([
      "wide",
      "wide",
      "framed",
      "wide",
      "framed",
    ]);
  });

  it("labels every image as a real operational product screen", () => {
    for (const step of PRODUCT_TOUR_STEPS) {
      expect(step.screenContext).toBe(
        "현재 운영 중인 우때 서비스의 실제 화면",
      );
    }
  });
});
