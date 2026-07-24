import type { ImgHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & {
    priority?: boolean;
    unoptimized?: boolean;
  }) => {
    const { priority, unoptimized, ...imageProps } = props;
    void priority;
    void unoptimized;

    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt is forwarded via imageProps spread
    return <img {...imageProps} />;
  },
}));

import { LandingView } from "@/app/_components/LandingView";

describe("LandingView", () => {
  it("renders the approved story and team in server HTML", () => {
    const html = renderToStaticMarkup(<LandingView />);

    expect(html).toContain("흩어진 여행 계획을");
    expect(html).toContain('id="features"');
    expect(html).toContain('id="how-it-works"');
    expect(html).toContain("기능 살펴보기");
    expect(html).toContain("우때 실제 서비스 화면");
    expect(html).not.toContain('href="/product"');
    expect(html).toContain('id="company"');
    expect(html).toContain('id="team"');
    expect(html).toContain("김민형");
    expect(html).toContain("박주영");
    expect(html).not.toContain("font-landing");
    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("text-[11px]");
    expect(html).not.toMatch(/예약 수수료|투자 유치/);
  });
});
