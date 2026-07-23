export const PUBLIC_SITE = {
  origin: "https://www.uttae.app",
  serviceName: "우때",
  englishServiceName: "Uttae",
  operatorName: "팀 우때 (Team Uttae)",
  founded: "2026-06",
  location: "Seoul, South Korea",
  githubOrganizationUrl: "https://github.com/uttae",
} as const;

export const PUBLIC_PRODUCT_STATUS = [
  "정식 출시",
  "현재 무료로 이용 가능",
  "Google 로그인 후 바로 시작",
] as const;

export const PUBLIC_COMPANY_FACTS = [
  { label: "설립", value: "2026년 6월" },
  { label: "소재지", value: "대한민국 서울" },
  { label: "제품 상태", value: "정식 출시 · 현재 무료 운영" },
  { label: "운영 주체", value: "팀 우때 (Team Uttae)" },
] as const;

export const PUBLIC_FOUNDERS = [
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
] as const;
