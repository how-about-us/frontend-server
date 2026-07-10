import { describe, expect, it } from "vitest";

import {
  LANDING_COLLABORATION_FEATURES,
  LANDING_FEATURE_STORIES,
  LANDING_HOW_STEPS,
  LANDING_TEAM_MEMBERS,
  LANDING_VALUES,
} from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";

describe("landing content contracts", () => {
  it("keeps the approved product story order", () => {
    expect(LANDING_VALUES.map((item) => item.title)).toEqual([
      "지도 기반 장소 탐색",
      "실시간 팀 협업",
      "여행 맥락을 아는 AI",
    ]);
    expect(LANDING_FEATURE_STORIES.map((item) => item.screenshotKey)).toEqual([
      "map",
      "placeShare",
      "plan",
    ]);
    expect(LANDING_COLLABORATION_FEATURES.map((item) => item.screenshotKey)).toEqual([
      "chat",
      "ai",
    ]);
    expect(LANDING_HOW_STEPS).toHaveLength(3);
  });

  it("publishes the approved team identities", () => {
    expect(LANDING_TEAM_MEMBERS).toEqual([
      {
        name: "김민형",
        role: "인프라 담당",
        description:
          "우때가 안정적으로 배포되고 운영될 수 있도록 서비스 인프라를 설계하고 관리합니다.",
        githubUrl: "https://github.com/minbros",
        githubLabel: "minbros",
      },
      {
        name: "박주영",
        role: "개발 및 운영 담당",
        description:
          "우때의 제품 개발과 사용자에게 제공되는 서비스 운영 전반을 담당합니다.",
        githubUrl: "https://github.com/parkjuyeong0312",
        githubLabel: "parkjuyeong0312",
      },
    ]);
  });

  it("does not use the landing display font in text styles", () => {
    const classNames = Object.values(landingTypography).join(" ");
    expect(classNames).not.toContain("font-landing");
    expect(landingTypography.heroBody).toContain("text-base");
    expect(landingTypography.sectionBody).toContain("text-base");
  });
});
