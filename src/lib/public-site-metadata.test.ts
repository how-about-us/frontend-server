import { describe, expect, it } from "vitest";

import {
  ORGANIZATION_JSON_LD,
  SOFTWARE_APPLICATION_JSON_LD,
} from "@/lib/public-site-metadata";

describe("public site structured data", () => {
  it("describes the operator and both founders with public links", () => {
    expect(ORGANIZATION_JSON_LD).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Team Uttae",
      url: "https://www.uttae.app",
      foundingDate: "2026-06",
      email: "contact@uttae.app",
      sameAs: ["https://github.com/uttae"],
    });
    expect(ORGANIZATION_JSON_LD.founder).toEqual([
      {
        "@type": "Person",
        name: "김민형",
        alternateName: "Minhyung Kim",
        sameAs: "https://github.com/minbros",
      },
      {
        "@type": "Person",
        name: "박주영",
        alternateName: "PARK JU YEONG",
        sameAs: "https://github.com/parkjuyeong0312",
      },
    ]);
  });

  it("describes the public web application without unverified claims", () => {
    expect(SOFTWARE_APPLICATION_JSON_LD).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "우때 (Uttae)",
      url: "https://www.uttae.app/product",
      applicationCategory: "TravelApplication",
      operatingSystem: "Web",
    });
    expect(JSON.stringify(SOFTWARE_APPLICATION_JSON_LD)).not.toMatch(
      /"(?:offers|price|isAccessibleForFree|aggregateRating|rating|award|funding|userCount|reviewCount|downloadCount|interactionStatistic)"\s*:|투자/i,
    );
  });
});
