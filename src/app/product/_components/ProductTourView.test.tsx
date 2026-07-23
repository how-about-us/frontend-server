import type { ImgHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      priority?: boolean;
      unoptimized?: boolean;
    },
  ) => {
    const { priority, unoptimized, ...imageProps } = props;
    void priority;
    void unoptimized;

    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- 테스트에서는 전달된 alt를 그대로 렌더링한다.
    return <img {...imageProps} />;
  },
}));

import { ProductTourView } from "@/app/product/_components/ProductTourView";

describe("ProductTourView", () => {
  it("renders the complete product proof in server HTML", () => {
    const html = renderToStaticMarkup(<ProductTourView />);

    expect(html.match(/현재 운영 중인 우때 서비스의 실제 화면/g)).toHaveLength(6);
    expect(html.match(/<img[^>]+src="\/landing\//g)).toHaveLength(6);
    expect(html).toContain('href="/login"');
    expect(html).toContain("Google 로그인 후 실제 서비스 시작");
    expect(html).not.toContain("opacity:0");
    expect(html).not.toMatch(
      /예약 수수료|투자 유치|정식 출시|현재 무료로 이용 가능/,
    );
  });

  it("renders the journey in review order", () => {
    const html = renderToStaticMarkup(<ProductTourView />);
    const orderedHeadings = [
      "지도에서 여행 장소를 함께 찾습니다",
      "찾은 장소를 대화와 일정으로 연결합니다",
      "같은 여행방에서 실시간으로 의논합니다",
      "날짜별 일정과 이동 동선을 완성합니다",
      "여행 맥락을 이해하는 AI를 함께 활용합니다",
    ];

    const positions = orderedHeadings.map((heading) => html.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
