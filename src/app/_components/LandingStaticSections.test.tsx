import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingHowItWorks } from "@/app/_components/LandingHowItWorks";
import { LandingTeamSection } from "@/app/_components/LandingTeamSection";

describe("landing static sections", () => {
  it("renders all onboarding steps at once", () => {
    const html = renderToStaticMarkup(<LandingHowItWorks />);
    expect(html).toContain("로그인하고 여행 방 만들기");
    expect(html).toContain("친구를 초대해 함께 장소 고르기");
    expect(html).toContain("일정과 이동 동선 완성하기");
    expect(html).not.toContain('role="tablist"');
  });

  it("renders the approved team and GitHub links", () => {
    const html = renderToStaticMarkup(<LandingTeamSection />);
    expect(html).toContain("김민형");
    expect(html).toContain("인프라 담당");
    expect(html).toContain('href="https://github.com/minbros"');
    expect(html).toContain("박주영");
    expect(html).toContain("개발 및 운영 담당");
    expect(html).toContain('href="https://github.com/parkjuyeong0312"');
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
    expect(html.match(/rel="noreferrer"/g)).toHaveLength(2);
  });
});
