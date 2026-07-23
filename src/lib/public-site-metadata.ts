import { SUPPORT_EMAIL } from "@/lib/contact";
import { PUBLIC_FOUNDERS, PUBLIC_SITE } from "@/lib/public-site";

export const PUBLIC_SITEMAP_ENTRIES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/product", changeFrequency: "weekly", priority: 0.9 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/operations-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/copyright-policy", changeFrequency: "yearly", priority: 0.3 },
] as const;

export const PUBLIC_ROBOT_DISALLOW_PATHS = [
  "/api/",
  "/auth/",
  "/home",
  "/plan",
  "/bookmark",
  "/search",
  "/member-settings",
  "/room-settings",
  "/settings",
  "/waiting",
] as const;

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Team Uttae",
  alternateName: "팀 우때",
  url: PUBLIC_SITE.origin,
  foundingDate: PUBLIC_SITE.founded,
  email: SUPPORT_EMAIL,
  location: {
    "@type": "Place",
    name: PUBLIC_SITE.location,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Seoul",
      addressCountry: "KR",
    },
  },
  founder: PUBLIC_FOUNDERS.map((founder) => ({
    "@type": "Person",
    name: founder.name,
    alternateName: founder.englishName,
    sameAs: founder.githubUrl,
  })),
  sameAs: [PUBLIC_SITE.githubOrganizationUrl],
} as const;

export const SOFTWARE_APPLICATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "우때 (Uttae)",
  url: `${PUBLIC_SITE.origin}/product`,
  applicationCategory: "TravelApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires a modern web browser",
  description:
    "친구들과 장소를 찾고 대화하며 일정과 이동 동선을 완성하는 실시간 협업 여행 플래너",
  featureList: [
    "지도 기반 장소 탐색",
    "실시간 채팅과 장소 공유",
    "날짜별 일정과 이동 동선",
    "여행 맥락 기반 AI 추천과 대화 요약",
  ],
  publisher: {
    "@type": "Organization",
    name: "Team Uttae",
    url: PUBLIC_SITE.origin,
  },
} as const;
