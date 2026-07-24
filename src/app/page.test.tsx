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

import RootPage from "@/app/page";

describe("RootPage", () => {
  it("publishes the organization and software application on the landing page", () => {
    const html = renderToStaticMarkup(<RootPage />);

    expect(html).toContain('id="uttae-organization"');
    expect(html).toContain('id="uttae-software-application"');
    expect(html).toContain('"url":"https://www.uttae.app"');
    expect(html).not.toContain("https://www.uttae.app/product");
  });
});
