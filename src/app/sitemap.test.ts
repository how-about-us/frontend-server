import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";

describe("sitemap metadata", () => {
  it("contains every public route and no authenticated route", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual([
      "https://www.uttae.app/",
      "https://www.uttae.app/terms",
      "https://www.uttae.app/privacy",
      "https://www.uttae.app/operations-policy",
      "https://www.uttae.app/copyright-policy",
    ]);
    expect(urls.join(" ")).not.toMatch(/\/home|\/api|\/join/);
    expect(entries.every((entry) => !("lastModified" in entry))).toBe(true);
    expect(entries).toHaveLength(5);
  });
});
