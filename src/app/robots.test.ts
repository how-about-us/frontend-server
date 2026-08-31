import { describe, expect, it } from "vitest";

import robots from "@/app/robots";

describe("robots metadata", () => {
  it("allows public crawling and points to the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      sitemap: "https://www.uttae.app/sitemap.xml",
      host: "https://www.uttae.app",
    });
  });
});
