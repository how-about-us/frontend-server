import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingMotion } from "@/app/_components/LandingMotion";

describe("LandingMotion", () => {
  it("renders children fully visible in server HTML", () => {
    const html = renderToStaticMarkup(
      <LandingMotion>
        <p>내용</p>
      </LandingMotion>,
    );

    expect(html).toContain("내용");
    expect(html).not.toContain("opacity-0");
    expect(html).not.toContain("opacity:0");
  });
});
