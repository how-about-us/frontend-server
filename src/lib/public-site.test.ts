import { describe, expect, it } from "vitest";

import {
  PUBLIC_COMPANY_FACTS,
  PUBLIC_FOUNDERS,
  PUBLIC_SITE,
} from "@/lib/public-site";

describe("public site facts", () => {
  it("publishes only the approved company and product facts", () => {
    expect(PUBLIC_SITE).toMatchObject({
      origin: "https://www.uttae.app",
      serviceName: "우때",
      englishServiceName: "Uttae",
      operatorName: "팀 우때 (Team Uttae)",
      founded: "2026-06",
      location: "Seoul, South Korea",
      githubOrganizationUrl: "https://github.com/uttae",
    });
    expect(PUBLIC_COMPANY_FACTS.map((fact) => fact.value)).toEqual([
      "2026년 6월",
      "대한민국 서울",
      "팀 우때 (Team Uttae)",
    ]);
  });

  it("publishes both founders with the same co-founder role", () => {
    expect(PUBLIC_FOUNDERS).toEqual([
      {
        name: "김민형",
        englishName: "Minhyung Kim",
        role: "공동창업자 · Co-founder",
        githubUrl: "https://github.com/minbros",
        githubLabel: "minbros",
      },
      {
        name: "박주영",
        englishName: "PARK JU YEONG",
        role: "공동창업자 · Co-founder",
        githubUrl: "https://github.com/parkjuyeong0312",
        githubLabel: "parkjuyeong0312",
      },
    ]);
  });

  it("does not publish application-only business or funding claims", () => {
    const publicFacts = JSON.stringify({
      site: PUBLIC_SITE,
      company: PUBLIC_COMPANY_FACTS,
      founders: PUBLIC_FOUNDERS,
    });

    expect(publicFacts).not.toMatch(/예약 수수료|투자 유치|VC|funding/i);
  });
});
