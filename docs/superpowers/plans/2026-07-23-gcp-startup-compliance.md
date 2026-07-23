# Google for Startups 공개 사이트 보강 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인하지 않은 방문자와 자동 심사기가 우때의 실제 제품 흐름, 운영 주체와 공동창업자를 공개 HTML에서 확인할 수 있도록 `/`, `/product`, `/login`, 검색 메타데이터를 보강한다.

**Architecture:** 검증된 공개 사실은 `src/lib/public-site.ts`의 단일 데이터 원천으로 관리하고, 기존 랜딩은 신뢰 정보를 요약한다. `/product`는 기존 6개 실제 스크린샷을 재사용하는 정적 서버 렌더링 페이지로 만들며, 검색 메타데이터와 JSON-LD도 같은 공개 사실에서 생성한다. 로그인 이후 제품, OAuth 동작, API와 백엔드는 변경하지 않는다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, React DOM server rendering

## Global Constraints

- 작업 기준 브랜치는 `origin/dev`, 구현 브랜치는 `codex/gcp-startup-compliance`이다.
- 고객용 공개 페이지에는 비즈니스 모델과 투자 유치 계획을 노출하지 않는다.
- `정식 출시`, `현재 무료로 이용 가능` 같은 심사 대응형 상태 배지를 공개 페이지에 추가하지 않는다. 실제 화면, 전체 사용 흐름과 실제 로그인 진입점으로 작동하는 제품임을 증명한다.
- 공동창업자 역할은 김민형과 박주영 모두 `공동창업자 · Co-founder`로 표시한다.
- LinkedIn, Crunchbase, 사용자 수, 매출, 투자, 수상, 확인되지 않은 경력을 추가하지 않는다.
- 실제처럼 보이는 가짜 앱 셸, 동작하지 않는 데모 컨트롤, 게스트 계정을 만들지 않는다.
- `/product`의 핵심 텍스트와 이미지에는 `LandingMotion`이나 초기 숨김 스타일을 적용하지 않는다.
- 기존 상단 `로그인` 버튼과 실제 Google OAuth 흐름을 유지한다.
- 새 공개 페이지는 쿠키, 인증, API 호출 없이 렌더링되어야 한다.
- 각 작업은 실패하는 테스트를 먼저 추가하고, 최소 구현으로 통과시킨 뒤 커밋한다.

---

## Task 1: 검증된 공개 사실의 단일 데이터 원천 만들기

**Files:**

- Create: `src/lib/public-site.ts`
- Create: `src/lib/public-site.test.ts`

- [ ] **Step 1: 공개 사실 계약 테스트 작성**

`src/lib/public-site.test.ts`를 만들고 승인된 값과 금지된 신청서용 문구가 섞이지 않는지 검증한다.

```ts
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
```

- [ ] **Step 2: 테스트가 모듈 부재로 실패하는지 확인**

Run:

```bash
npx vitest run src/lib/public-site.test.ts
```

Expected: `@/lib/public-site`를 찾을 수 없어 FAIL.

- [ ] **Step 3: 공개 사실 모듈 구현**

`src/lib/public-site.ts`를 다음 구조로 만든다.

```ts
export const PUBLIC_SITE = {
  origin: "https://www.uttae.app",
  serviceName: "우때",
  englishServiceName: "Uttae",
  operatorName: "팀 우때 (Team Uttae)",
  founded: "2026-06",
  location: "Seoul, South Korea",
  githubOrganizationUrl: "https://github.com/uttae",
} as const;

export const PUBLIC_COMPANY_FACTS = [
  { label: "설립", value: "2026년 6월" },
  { label: "소재지", value: "대한민국 서울" },
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
```

- [ ] **Step 4: 공개 사실 테스트 통과 확인**

Run:

```bash
npx vitest run src/lib/public-site.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: 공개 사실 모듈 커밋**

```bash
git add src/lib/public-site.ts src/lib/public-site.test.ts
git commit -m "feat(landing): 공개 회사 정보 모델 추가" -m "- 출시 상태와 회사 기본 정보를 단일 데이터 원천으로 구성
- 공동창업자 실명과 GitHub 검증 정보를 정의"
```

---

## Task 2: 메인 랜딩에 회사·공동창업자 신뢰 정보 추가

**Files:**

- Modify: `src/lib/landing/landing-content.ts`
- Modify: `src/lib/landing/landing-content.test.ts`
- Create: `src/app/_components/LandingCompanySection.tsx`
- Modify: `src/app/_components/LandingHeader.tsx`
- Modify: `src/app/_components/LandingHero.tsx`
- Modify: `src/app/_components/LandingTeamSection.tsx`
- Modify: `src/app/_components/LandingView.tsx`
- Modify: `src/app/_components/LandingStaticSections.test.tsx`
- Modify: `src/app/_components/LandingView.test.tsx`

- [ ] **Step 1: 랜딩 콘텐츠 계약 테스트를 새 공개 사실에 맞게 변경**

`src/lib/landing/landing-content.test.ts`의 팀 테스트 기대값을 다음으로 바꾸고, 두 역할이 동일한지 명시적으로 검증한다.

```ts
it("publishes the approved co-founder identities", () => {
  expect(LANDING_TEAM_MEMBERS).toEqual([
    {
      name: "김민형",
      englishName: "Minhyung Kim",
      role: "공동창업자 · Co-founder",
      description: "우때를 공동으로 만들고 운영합니다.",
      githubUrl: "https://github.com/minbros",
      githubLabel: "minbros",
    },
    {
      name: "박주영",
      englishName: "PARK JU YEONG",
      role: "공동창업자 · Co-founder",
      description: "우때를 공동으로 만들고 운영합니다.",
      githubUrl: "https://github.com/parkjuyeong0312",
      githubLabel: "parkjuyeong0312",
    },
  ]);
  expect(new Set(LANDING_TEAM_MEMBERS.map((member) => member.role))).toEqual(
    new Set(["공동창업자 · Co-founder"]),
  );
});
```

- [ ] **Step 2: 정적 랜딩 테스트에 회사·GitHub 요구사항 추가**

`src/app/_components/LandingStaticSections.test.tsx`에 `LandingCompanySection`을 import하고 다음 검증을 추가한다.

```tsx
it("renders the approved operational facts", () => {
  const html = renderToStaticMarkup(<LandingCompanySection />);

  expect(html).toContain("2026년 6월");
  expect(html).toContain("대한민국 서울");
  expect(html).toContain("팀 우때 (Team Uttae)");
  expect(html).not.toMatch(/예약 수수료|투자 유치/);
});
```

기존 팀 테스트는 다음 요구사항으로 교체한다.

```tsx
it("renders both co-founders and reciprocal GitHub links", () => {
  const html = renderToStaticMarkup(<LandingTeamSection />);

  expect(html).toContain("김민형");
  expect(html).toContain("Minhyung Kim");
  expect(html).toContain("박주영");
  expect(html).toContain("PARK JU YEONG");
  expect(html.match(/공동창업자 · Co-founder/g)).toHaveLength(2);
  expect(html).toContain('href="https://github.com/minbros"');
  expect(html).toContain('href="https://github.com/parkjuyeong0312"');
  expect(html).toContain('href="https://github.com/uttae"');
  expect(html.match(/target="_blank"/g)).toHaveLength(3);
  expect(html.match(/rel="noreferrer"/g)).toHaveLength(3);
});
```

`src/app/_components/LandingView.test.tsx`의 서버 HTML 검증에 아래 단언을 추가한다.

```ts
expect(html).toContain('href="/product"');
expect(html).toContain('id="company"');
expect(html).not.toMatch(/예약 수수료|투자 유치/);
```

- [ ] **Step 3: 변경된 랜딩 테스트가 실패하는지 확인**

Run:

```bash
npx vitest run src/lib/landing/landing-content.test.ts src/app/_components/LandingStaticSections.test.tsx src/app/_components/LandingView.test.tsx
```

Expected: 이전 역할, 누락된 `LandingCompanySection`, `/product` 링크 때문에 FAIL.

- [ ] **Step 4: 랜딩 팀 콘텐츠를 공개 사실 모듈에서 파생**

`src/lib/landing/landing-content.ts`에 다음 import를 추가한다.

```ts
import { PUBLIC_FOUNDERS } from "@/lib/public-site";
```

`LandingTeamMember`와 `LANDING_TEAM_MEMBERS`를 다음처럼 변경한다.

```ts
export type LandingTeamMember = {
  name: string;
  englishName: string;
  role: string;
  description: string;
  githubUrl: string;
  githubLabel: string;
};

export const LANDING_TEAM_MEMBERS: readonly LandingTeamMember[] =
  PUBLIC_FOUNDERS.map((founder) => ({
    ...founder,
    description: "우때를 공동으로 만들고 운영합니다.",
  }));
```

- [ ] **Step 5: 회사 정보 섹션 추가**

`src/app/_components/LandingCompanySection.tsx`를 만든다.

```tsx
import {
  LANDING_CONTAINER_CLASS,
  LANDING_SECTION_PY,
} from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";
import { PUBLIC_COMPANY_FACTS } from "@/lib/public-site";

export function LandingCompanySection() {
  return (
    <section
      id="company"
      className={`scroll-mt-24 border-t border-gray-border/50 bg-brand-red/[0.035] ${LANDING_SECTION_PY}`}
      aria-labelledby="company-heading"
    >
      <div className={LANDING_CONTAINER_CLASS}>
        <div className="mx-auto max-w-3xl text-center">
          <p className={landingTypography.eyebrow}>ABOUT UTTAE</p>
          <h2 id="company-heading" className={`${landingTypography.sectionTitle} mt-3`}>
            함께 만드는 협업 여행 플래너
          </h2>
          <p className={`${landingTypography.sectionBody} mt-4`}>
            우때는 친구들과 여행 계획을 실시간으로 완성할 수 있도록 팀 우때가
            만들고 운영하는 웹 서비스입니다.
          </p>
        </div>
        <dl className="mx-auto mt-10 grid max-w-4xl gap-4 landing-sm:grid-cols-3">
          {PUBLIC_COMPANY_FACTS.map((fact) => (
            <div
              key={fact.label}
              className="rounded-2xl border border-gray-border bg-white p-5 text-center"
            >
              <dt className="text-sm font-bold text-dark-gray">{fact.label}</dt>
              <dd className="mt-2 text-base font-extrabold text-neutral-900">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: 헤더 링크를 모든 공개 경로에서 유효하게 변경**

`src/app/_components/LandingHeader.tsx`의 `navItems`를 다음으로 바꾼다.

```ts
const navItems = [
  { href: "/#features", label: "기능" },
  { href: "/#how-it-works", label: "사용 방법" },
  { href: "/product", label: "제품 둘러보기" },
  { href: "/#team", label: "팀" },
] as const;
```

내비게이션 반복문의 `<a>`를 기존에 import된 `Link`로 바꾼다.

```tsx
<Link
  key={item.href}
  href={item.href}
  className="text-sm font-semibold text-dark-gray transition hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
>
  {item.label}
</Link>
```

모바일에서는 현재 동작대로 내비게이션을 숨기고 로고와 로그인 버튼을 유지한다.

- [ ] **Step 7: 히어로에 제품 페이지 CTA 추가**

`src/app/_components/LandingHero.tsx`에 `Link`를 import한다.

```ts
import Link from "next/link";
```

상태 배지는 추가하지 않고 기존 보조 CTA만 다음 링크로 교체한다.

```tsx
<Link
  href="/product"
  className="inline-flex items-center justify-center rounded-full border border-gray-border bg-white px-7 py-3 text-base font-bold text-dark-gray transition hover:border-brand-red/40 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
>
  제품 화면 보기
</Link>
```

- [ ] **Step 8: 팀 카드에 영문명과 조직 GitHub 링크 추가**

`src/app/_components/LandingTeamSection.tsx`에 `PUBLIC_SITE`를 import한다.

```ts
import { PUBLIC_SITE } from "@/lib/public-site";
```

이름을 다음처럼 표시한다.

```tsx
<h3 className="mt-2 text-2xl font-bold text-white">{member.name}</h3>
<p className="mt-1 text-sm font-semibold text-white/55">{member.englishName}</p>
```

팀 카드 그리드 뒤에 공식 조직 링크를 추가한다.

```tsx
<div className="mt-8 text-center">
  <a
    href={PUBLIC_SITE.githubOrganizationUrl}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
  >
    <GithubIcon className="h-4 w-4" aria-hidden />
    Uttae GitHub 조직
  </a>
</div>
```

- [ ] **Step 9: 랜딩 전체 구성에 회사 섹션 연결**

`src/app/_components/LandingView.tsx`에 `LandingCompanySection`을 import하고 `LandingHowItWorks`와 `LandingTeamSection` 사이에 배치한다.

```tsx
<LandingMotion>
  <LandingHowItWorks />
</LandingMotion>
<LandingMotion>
  <LandingCompanySection />
</LandingMotion>
<LandingMotion>
  <LandingTeamSection />
</LandingMotion>
```

- [ ] **Step 10: 랜딩 관련 테스트 통과 확인**

Run:

```bash
npx vitest run src/lib/landing/landing-content.test.ts src/app/_components/LandingStaticSections.test.tsx src/app/_components/LandingView.test.tsx
```

Expected: 모든 관련 테스트 PASS.

- [ ] **Step 11: 랜딩 보강 커밋**

```bash
git add src/lib/landing/landing-content.ts src/lib/landing/landing-content.test.ts src/app/_components/LandingCompanySection.tsx src/app/_components/LandingHeader.tsx src/app/_components/LandingHero.tsx src/app/_components/LandingTeamSection.tsx src/app/_components/LandingView.tsx src/app/_components/LandingStaticSections.test.tsx src/app/_components/LandingView.test.tsx
git commit -m "feat(landing): 출시 및 공동창업자 정보 보강" -m "- 제품 출시 상태와 공개 회사 정보를 랜딩에 추가
- 공동창업자 역할과 GitHub 상호 검증 링크를 통일
- 공개 제품 소개 페이지 진입 링크를 추가"
```

---

## Task 3: 공개 제품 흐름의 정적 콘텐츠 계약 만들기

**Files:**

- Create: `src/lib/product/product-tour-content.ts`
- Create: `src/lib/product/product-tour-content.test.ts`

- [ ] **Step 1: 제품 흐름과 스크린샷 순서 테스트 작성**

`src/lib/product/product-tour-content.test.ts`를 만든다.

```ts
import { describe, expect, it } from "vitest";

import {
  PRODUCT_TOUR_FLOW,
  PRODUCT_TOUR_STEPS,
} from "@/lib/product/product-tour-content";

describe("product tour content", () => {
  it("keeps the complete product flow in review order", () => {
    expect(PRODUCT_TOUR_FLOW).toEqual([
      "방 생성",
      "장소 탐색",
      "장소 공유와 대화",
      "일정 구성",
      "AI 활용",
    ]);
    expect(PRODUCT_TOUR_STEPS.map((step) => step.screenshotKey)).toEqual([
      "map",
      "placeShare",
      "chat",
      "plan",
      "ai",
    ]);
    expect(PRODUCT_TOUR_STEPS.map((step) => step.layout)).toEqual([
      "wide",
      "wide",
      "framed",
      "wide",
      "framed",
    ]);
  });

  it("labels every image as a real operational product screen", () => {
    for (const step of PRODUCT_TOUR_STEPS) {
      expect(step.screenContext).toBe(
        "현재 운영 중인 우때 서비스의 실제 화면",
      );
    }
  });
});
```

- [ ] **Step 2: 제품 콘텐츠 테스트 실패 확인**

Run:

```bash
npx vitest run src/lib/product/product-tour-content.test.ts
```

Expected: 제품 콘텐츠 모듈 부재로 FAIL.

- [ ] **Step 3: 제품 흐름 콘텐츠 구현**

`src/lib/product/product-tour-content.ts`를 만든다.

```ts
import type { LandingFeatureScreenshotKey } from "@/lib/landing/landing-screenshots";

export type ProductTourStep = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  points: readonly string[];
  screenshotKey: LandingFeatureScreenshotKey;
  layout: "wide" | "framed";
  screenContext: "현재 운영 중인 우때 서비스의 실제 화면";
};

export const PRODUCT_TOUR_FLOW = [
  "방 생성",
  "장소 탐색",
  "장소 공유와 대화",
  "일정 구성",
  "AI 활용",
] as const;

export const PRODUCT_TOUR_STEPS: readonly ProductTourStep[] = [
  {
    id: "discover",
    index: "01",
    eyebrow: "DISCOVER",
    title: "지도에서 여행 장소를 함께 찾습니다",
    description:
      "카테고리와 조건으로 후보 장소를 탐색하고 팀 북마크에 모아 비교합니다.",
    points: ["카테고리별 탐색", "조건별 필터", "팀 북마크"],
    screenshotKey: "map",
    layout: "wide",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
  {
    id: "share",
    index: "02",
    eyebrow: "SHARE",
    title: "찾은 장소를 대화와 일정으로 연결합니다",
    description:
      "사진, 평점, 주소가 담긴 장소 카드를 공유하고 북마크나 일정에 바로 추가합니다.",
    points: ["장소 상세 확인", "채팅으로 공유", "일정에 추가"],
    screenshotKey: "placeShare",
    layout: "wide",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
  {
    id: "chat",
    index: "03",
    eyebrow: "CHAT",
    title: "같은 여행방에서 실시간으로 의논합니다",
    description:
      "장소 카드를 보며 의견을 나누고 흩어진 메신저 없이 계획을 이어갑니다.",
    points: ["실시간 대화", "장소 카드 공유", "팀 단위 협업"],
    screenshotKey: "chat",
    layout: "framed",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
  {
    id: "plan",
    index: "04",
    eyebrow: "PLAN",
    title: "날짜별 일정과 이동 동선을 완성합니다",
    description:
      "체류 시간과 메모를 정리하고 순서를 조정하며 지도에서 이동 경로를 확인합니다.",
    points: ["날짜와 시간", "드래그 순서 조정", "지도 이동 경로"],
    screenshotKey: "plan",
    layout: "wide",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
  {
    id: "ai",
    index: "05",
    eyebrow: "WOORI AI",
    title: "여행 맥락을 이해하는 AI를 함께 활용합니다",
    description:
      "팀 대화에 맞는 장소 추천을 받고 길어진 대화의 핵심을 요약해 확인합니다.",
    points: ["맥락 기반 추천", "대화 요약", "팀과 결과 공유"],
    screenshotKey: "ai",
    layout: "framed",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
];
```

- [ ] **Step 4: 제품 콘텐츠 테스트 통과 확인**

Run:

```bash
npx vitest run src/lib/product/product-tour-content.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: 제품 콘텐츠 계약 커밋**

```bash
git add src/lib/product/product-tour-content.ts src/lib/product/product-tour-content.test.ts
git commit -m "feat(product): 공개 제품 흐름 콘텐츠 정의" -m "- 실제 사용 흐름과 스크린샷 순서를 정적 데이터로 구성
- 모든 화면에 현재 운영 중인 실제 제품 맥락을 명시"
```

---

## Task 4: 로그인 없이 보이는 `/product` 정적 제품 소개 페이지 추가

**Files:**

- Create: `src/app/product/_components/ProductTourHero.tsx`
- Create: `src/app/product/_components/ProductTourStep.tsx`
- Create: `src/app/product/_components/ProductTourFinalCta.tsx`
- Create: `src/app/product/_components/ProductTourView.tsx`
- Create: `src/app/product/_components/ProductTourView.test.tsx`
- Create: `src/app/product/page.tsx`

- [ ] **Step 1: 제품 페이지 서버 HTML 테스트 작성**

`src/app/product/_components/ProductTourView.test.tsx`를 만든다. `next/image` mock은 기존 `LandingView.test.tsx`와 동일하게 사용한다.

```tsx
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
    expect(html.match(/<img/g)).toHaveLength(6);
    expect(html).toContain('href="/login"');
    expect(html).toContain("Google 로그인 후 실제 서비스 시작");
    expect(html).not.toContain("opacity:0");
    expect(html).not.toMatch(/예약 수수료|투자 유치/);
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
```

- [ ] **Step 2: 제품 페이지 테스트 실패 확인**

Run:

```bash
npx vitest run src/app/product/_components/ProductTourView.test.tsx
```

Expected: `ProductTourView` 모듈 부재로 FAIL.

- [ ] **Step 3: 제품 히어로 구현**

`src/app/product/_components/ProductTourHero.tsx`를 만든다.

```tsx
import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import { LANDING_CONTAINER_CLASS } from "@/lib/landing/landing-content";
import {
  LANDING_HERO_SCREENSHOT,
  LANDING_HERO_SCREENSHOT_SIZES,
} from "@/lib/landing/landing-screenshots";
import { landingTypography } from "@/lib/landing/landing-typography";
import { PRODUCT_TOUR_FLOW } from "@/lib/product/product-tour-content";

export function ProductTourHero() {
  return (
    <section className="bg-[radial-gradient(circle_at_50%_12%,rgba(241,45,51,0.11),transparent_35%)] pt-16 pb-12 landing-lg:pt-24 landing-lg:pb-16">
      <div className={`${LANDING_CONTAINER_CLASS} text-center`}>
        <p className={landingTypography.eyebrow}>LIVE PRODUCT TOUR</p>
        <h1 className={`${landingTypography.heroTitle} mx-auto mt-4 max-w-4xl`}>
          실제 화면으로 보는 우때
        </h1>
        <p className={`${landingTypography.heroBody} mx-auto mt-5 max-w-3xl`}>
          현재 운영 중인 우때에서 장소를 찾고, 대화하고, 일정과 이동 동선을
          완성하는 전체 흐름을 확인하세요.
        </p>
        <div className="mx-auto mt-10 max-w-[1080px] overflow-hidden rounded-2xl border border-gray-border bg-white p-2 shadow-[0_24px_70px_-28px_rgba(71,31,33,0.28)] landing-sm:p-3">
          <p className="px-3 pt-2 pb-3 text-left text-sm font-semibold text-dark-gray">
            현재 운영 중인 우때 서비스의 실제 화면
          </p>
          <LandingScreenshot
            screenshot={LANDING_HERO_SCREENSHOT}
            priority
            sizes={LANDING_HERO_SCREENSHOT_SIZES}
            className="rounded-xl"
          />
        </div>
        <ol className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-2">
          {PRODUCT_TOUR_FLOW.map((step, index) => (
            <li
              key={step}
              className="rounded-full border border-gray-border bg-white px-4 py-2 text-sm font-bold text-neutral-900"
            >
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 가로·세로 제품 단계 컴포넌트 구현**

`src/app/product/_components/ProductTourStep.tsx`를 만든다.

```tsx
import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import {
  LANDING_CONTAINER_CLASS,
  LANDING_SECTION_PY,
} from "@/lib/landing/landing-content";
import {
  LANDING_FEATURE_SCREENSHOTS,
  LANDING_FEATURE_SCREENSHOT_SIZES,
  LANDING_FRAMED_SCREENSHOT_SIZES,
} from "@/lib/landing/landing-screenshots";
import { landingTypography } from "@/lib/landing/landing-typography";
import type { ProductTourStep as ProductTourStepContent } from "@/lib/product/product-tour-content";

function StepCopy({ step }: { step: ProductTourStepContent }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className={landingTypography.eyebrow}>
        {step.index} · {step.eyebrow}
      </p>
      <h2 className={`${landingTypography.sectionTitle} mt-3`}>{step.title}</h2>
      <p className={`${landingTypography.sectionBody} mt-4`}>{step.description}</p>
    </div>
  );
}

function StepPoints({ step }: { step: ProductTourStepContent }) {
  return (
    <ul className="mx-auto mt-6 grid max-w-4xl gap-3 landing-sm:grid-cols-3">
      {step.points.map((point) => (
        <li
          key={point}
          className={`${landingTypography.pointLabel} rounded-xl border border-gray-border bg-white px-4 py-3 text-center`}
        >
          {point}
        </li>
      ))}
    </ul>
  );
}

export function ProductTourStory({
  step,
  tone,
}: {
  step: ProductTourStepContent;
  tone: "white" | "tint";
}) {
  const screenshot = LANDING_FEATURE_SCREENSHOTS[step.screenshotKey];

  return (
    <section
      id={step.id}
      className={`scroll-mt-24 border-t border-gray-border/50 ${LANDING_SECTION_PY} ${
        tone === "tint" ? "bg-brand-red/[0.035]" : "bg-white"
      }`}
    >
      <div className={LANDING_CONTAINER_CLASS}>
        <StepCopy step={step} />
        <div className="mx-auto mt-10 max-w-[1080px] overflow-hidden rounded-2xl border border-gray-border bg-white p-2 shadow-[0_20px_55px_-30px_rgba(71,31,33,0.24)] landing-sm:p-3">
          <p className="px-3 pt-2 pb-3 text-sm font-semibold text-dark-gray">
            {step.screenContext}
          </p>
          <LandingScreenshot
            screenshot={screenshot}
            sizes={LANDING_FEATURE_SCREENSHOT_SIZES}
            className="rounded-xl"
          />
        </div>
        <StepPoints step={step} />
      </div>
    </section>
  );
}

export function ProductTourCollaboration({
  step,
  tone,
}: {
  step: ProductTourStepContent;
  tone: "white" | "tint";
}) {
  const screenshot = LANDING_FEATURE_SCREENSHOTS[step.screenshotKey];

  return (
    <section
      id={step.id}
      className={`scroll-mt-24 border-t border-gray-border/50 ${LANDING_SECTION_PY} ${
        tone === "tint" ? "bg-brand-red/[0.035]" : "bg-white"
      }`}
    >
      <div className={LANDING_CONTAINER_CLASS}>
        <StepCopy step={step} />
        <div className="mx-auto mt-10 max-w-[360px]">
          <p className="mb-3 text-center text-sm font-semibold text-dark-gray">
            {step.screenContext}
          </p>
          <LandingScreenshot
            screenshot={screenshot}
            sizes={LANDING_FRAMED_SCREENSHOT_SIZES}
          />
        </div>
        <StepPoints step={step} />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 실제 로그인 진입 CTA 구현**

`src/app/product/_components/ProductTourFinalCta.tsx`를 만든다.

```tsx
import { LandingActionLink } from "@/app/_components/LandingActionLink";
import {
  LANDING_CONTAINER_CLASS,
  LANDING_SECTION_PY,
} from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";

export function ProductTourFinalCta() {
  return (
    <section className={`border-t border-gray-border bg-white ${LANDING_SECTION_PY}`}>
      <div className={`${LANDING_CONTAINER_CLASS} text-center`}>
        <p className={landingTypography.eyebrow}>AVAILABLE NOW</p>
        <h2 className={`${landingTypography.ctaTitle} mt-3`}>
          Google 로그인 후 실제 서비스 시작
        </h2>
        <p className={`${landingTypography.sectionBody} mx-auto mt-4 max-w-2xl`}>
          여행 방을 만들고 친구를 초대해 함께 계획을 시작할 수 있습니다.
        </p>
        <LandingActionLink href="/login" className="mt-7 px-7 py-3">
          우때 시작하기
        </LandingActionLink>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: 제품 페이지 전체 구성과 라우트 구현**

`src/app/product/_components/ProductTourView.tsx`를 만든다.

```tsx
import { LandingHeader } from "@/app/_components/LandingHeader";
import { ProductTourFinalCta } from "@/app/product/_components/ProductTourFinalCta";
import { ProductTourHero } from "@/app/product/_components/ProductTourHero";
import {
  ProductTourCollaboration,
  ProductTourStory,
} from "@/app/product/_components/ProductTourStep";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PRODUCT_TOUR_STEPS } from "@/lib/product/product-tour-content";

export function ProductTourView() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white font-sans">
      <LandingHeader />
      <main className="relative z-10 flex flex-1 flex-col antialiased">
        <ProductTourHero />
        {PRODUCT_TOUR_STEPS.map((step, index) =>
          step.layout === "wide" ? (
            <ProductTourStory
              key={step.id}
              step={step}
              tone={index % 2 === 0 ? "white" : "tint"}
            />
          ) : (
            <ProductTourCollaboration
              key={step.id}
              step={step}
              tone={index % 2 === 0 ? "white" : "tint"}
            />
          ),
        )}
        <ProductTourFinalCta />
      </main>
      <SiteFooter className="font-sans" />
    </div>
  );
}
```

`src/app/product/page.tsx`를 만든다. 메타데이터와 JSON-LD는 Task 5에서 추가한다.

```tsx
import { ProductTourView } from "@/app/product/_components/ProductTourView";

export default function ProductPage() {
  return <ProductTourView />;
}
```

- [ ] **Step 7: 제품 페이지 서버 HTML 테스트 통과 확인**

Run:

```bash
npx vitest run src/app/product/_components/ProductTourView.test.tsx
```

Expected: 2 tests PASS, `<img>` 6개, 실제 화면 문맥 6개, `/login` CTA가 서버 HTML에 존재.

- [ ] **Step 8: 제품 페이지 커밋**

```bash
git add src/app/product src/lib/product
git commit -m "feat(product): 공개 제품 소개 페이지 추가" -m "- 실제 운영 화면 6개로 전체 여행 계획 흐름을 구성
- 로그인 없이 읽히는 정적 제품 페이지와 실제 로그인 CTA를 추가"
```

---

## Task 5: canonical·소셜 메타데이터와 구조화 데이터 추가

**Files:**

- Create: `src/lib/public-site-metadata.ts`
- Create: `src/lib/public-site-metadata.test.ts`
- Create: `src/components/seo/StructuredData.tsx`
- Create: `src/components/seo/StructuredData.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/product/page.tsx`

- [ ] **Step 1: 검증된 JSON-LD 계약 테스트 작성**

`src/lib/public-site-metadata.test.ts`를 만든다.

```ts
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
      /price|rating|award|funding|투자/i,
    );
  });
});
```

- [ ] **Step 2: 안전한 JSON-LD 렌더링 테스트 작성**

`src/components/seo/StructuredData.test.tsx`를 만든다.

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StructuredData } from "@/components/seo/StructuredData";

describe("StructuredData", () => {
  it("renders JSON-LD and escapes closing script input", () => {
    const html = renderToStaticMarkup(
      <StructuredData
        id="test-json-ld"
        data={{ name: "</script><script>alert(1)</script>" }}
      />,
    );

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('id="test-json-ld"');
    expect(html).toContain("\\u003c/script>");
    expect(html).not.toContain("</script><script>alert");
  });
});
```

- [ ] **Step 3: 메타데이터 테스트 실패 확인**

Run:

```bash
npx vitest run src/lib/public-site-metadata.test.ts src/components/seo/StructuredData.test.tsx
```

Expected: 두 모듈 부재로 FAIL.

- [ ] **Step 4: 구조화 데이터 상수 구현**

`src/lib/public-site-metadata.ts`를 만든다.

```ts
import { SUPPORT_EMAIL } from "@/lib/contact";
import { PUBLIC_FOUNDERS, PUBLIC_SITE } from "@/lib/public-site";

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
```

- [ ] **Step 5: 안전한 JSON-LD 컴포넌트 구현**

`src/components/seo/StructuredData.tsx`를 만든다.

```tsx
type StructuredDataValue = Record<string, unknown>;

export function StructuredData({
  id,
  data,
}: {
  id: string;
  data: StructuredDataValue;
}) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
```

- [ ] **Step 6: JSON-LD 단위 테스트 통과 확인**

Run:

```bash
npx vitest run src/lib/public-site-metadata.test.ts src/components/seo/StructuredData.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 7: 전역 도메인 기준과 랜딩 메타데이터 연결**

`src/app/layout.tsx`에 `PUBLIC_SITE`를 import하고 전역 metadata에 기준 URL을 추가한다.

```ts
import { PUBLIC_SITE } from "@/lib/public-site";
```

```ts
export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE.origin),
  title: "우때",
  description: "실시간 협업 여행 플래너",
  // 기존 icons 유지
};
```

`src/app/page.tsx`를 다음 구조로 변경한다.

```tsx
import type { Metadata } from "next";

import { LandingView } from "@/app/_components/LandingView";
import { StructuredData } from "@/components/seo/StructuredData";
import { ORGANIZATION_JSON_LD } from "@/lib/public-site-metadata";
import { brandAssets } from "@/lib/public-assets";

const title = "우때 — 실시간 협업 여행 플래너";
const description =
  "우때에서 친구들과 장소를 찾고 대화하며 여행 일정을 함께 완성하세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "우때",
    locale: "ko_KR",
    type: "website",
    images: [{ url: brandAssets.shareImage, width: 1200, height: 1200, alt: "우때" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [brandAssets.shareImage],
  },
};

export default function RootPage() {
  return (
    <>
      <StructuredData id="uttae-organization" data={ORGANIZATION_JSON_LD} />
      <LandingView />
    </>
  );
}
```

- [ ] **Step 8: 제품 페이지 메타데이터와 JSON-LD 연결**

`src/app/product/page.tsx`를 다음 구조로 변경한다.

```tsx
import type { Metadata } from "next";

import { ProductTourView } from "@/app/product/_components/ProductTourView";
import { StructuredData } from "@/components/seo/StructuredData";
import { SOFTWARE_APPLICATION_JSON_LD } from "@/lib/public-site-metadata";
import { brandAssets } from "@/lib/public-assets";

const title = "우때 제품 둘러보기 — 실제 화면으로 보는 협업 여행 플래너";
const description =
  "현재 운영 중인 우때의 장소 탐색, 실시간 채팅, 일정 구성과 AI 기능을 실제 제품 화면으로 확인하세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/product" },
  openGraph: {
    title,
    description,
    url: "/product",
    siteName: "우때",
    locale: "ko_KR",
    type: "website",
    images: [{ url: brandAssets.shareImage, width: 1200, height: 1200, alt: "우때" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [brandAssets.shareImage],
  },
};

export default function ProductPage() {
  return (
    <>
      <StructuredData
        id="uttae-software-application"
        data={SOFTWARE_APPLICATION_JSON_LD}
      />
      <ProductTourView />
    </>
  );
}
```

- [ ] **Step 9: 메타데이터 관련 테스트와 타입 검사 수행**

Run:

```bash
npx vitest run src/lib/public-site-metadata.test.ts src/components/seo/StructuredData.test.tsx
npx tsc --noEmit
```

Expected: 모든 테스트 PASS, TypeScript 오류 없음.

- [ ] **Step 10: 메타데이터 보강 커밋**

```bash
git add src/lib/public-site-metadata.ts src/lib/public-site-metadata.test.ts src/components/seo/StructuredData.tsx src/components/seo/StructuredData.test.tsx src/app/layout.tsx src/app/page.tsx src/app/product/page.tsx
git commit -m "feat(seo): 공개 사이트 검증 메타데이터 추가" -m "- 랜딩과 제품 페이지 canonical 및 소셜 메타데이터 구성
- 회사와 제품의 검증된 JSON-LD를 서버 HTML에 추가"
```

---

## Task 6: robots와 sitemap으로 공개 탐색 경로 명시

**Files:**

- Modify: `src/lib/public-site-metadata.ts`
- Modify: `src/lib/public-site-metadata.test.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/robots.test.ts`
- Create: `src/app/sitemap.ts`
- Create: `src/app/sitemap.test.ts`

- [ ] **Step 1: 공개·비공개 탐색 경로 계약 테스트 추가**

`src/lib/public-site-metadata.test.ts`에 다음 테스트를 추가한다.

```ts
it("lists only public reviewable pages in the sitemap contract", () => {
  expect(PUBLIC_SITEMAP_ENTRIES.map((entry) => entry.path)).toEqual([
    "/",
    "/product",
    "/terms",
    "/privacy",
    "/operations-policy",
    "/copyright-policy",
  ]);
  expect(PUBLIC_ROBOT_DISALLOW_PATHS).toContain("/api/");
  expect(PUBLIC_ROBOT_DISALLOW_PATHS).toContain("/home");
  expect(PUBLIC_ROBOT_DISALLOW_PATHS).not.toContain("/product");
});
```

테스트 import에 `PUBLIC_ROBOT_DISALLOW_PATHS`와 `PUBLIC_SITEMAP_ENTRIES`를 추가한다.

- [ ] **Step 2: robots와 sitemap 반환값 테스트 작성**

`src/app/robots.test.ts`를 만든다.

```ts
import { describe, expect, it } from "vitest";

import robots from "@/app/robots";

describe("robots metadata", () => {
  it("allows public crawling and points to the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
      },
      sitemap: "https://www.uttae.app/sitemap.xml",
      host: "https://www.uttae.app",
    });
  });
});
```

`src/app/sitemap.test.ts`를 만든다.

```ts
import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";

describe("sitemap metadata", () => {
  it("contains every public route and no authenticated route", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual([
      "https://www.uttae.app/",
      "https://www.uttae.app/product",
      "https://www.uttae.app/terms",
      "https://www.uttae.app/privacy",
      "https://www.uttae.app/operations-policy",
      "https://www.uttae.app/copyright-policy",
    ]);
    expect(urls.join(" ")).not.toMatch(/\/home|\/api|\/join/);
  });
});
```

- [ ] **Step 3: 탐색 경로 테스트 실패 확인**

Run:

```bash
npx vitest run src/lib/public-site-metadata.test.ts src/app/robots.test.ts src/app/sitemap.test.ts
```

Expected: 경로 상수와 메타데이터 라우트 부재로 FAIL.

- [ ] **Step 4: 탐색 경로 상수 추가**

`src/lib/public-site-metadata.ts`에 다음 상수를 추가한다.

```ts
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
```

- [ ] **Step 5: robots 메타데이터 라우트 구현**

`src/app/robots.ts`를 만든다.

```ts
import type { MetadataRoute } from "next";

import { PUBLIC_ROBOT_DISALLOW_PATHS } from "@/lib/public-site-metadata";
import { PUBLIC_SITE } from "@/lib/public-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PUBLIC_ROBOT_DISALLOW_PATHS],
    },
    sitemap: `${PUBLIC_SITE.origin}/sitemap.xml`,
    host: PUBLIC_SITE.origin,
  };
}
```

- [ ] **Step 6: sitemap 메타데이터 라우트 구현**

`src/app/sitemap.ts`를 만든다.

```ts
import type { MetadataRoute } from "next";

import { PUBLIC_SITEMAP_ENTRIES } from "@/lib/public-site-metadata";
import { PUBLIC_SITE } from "@/lib/public-site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_ENTRIES.map((entry) => ({
    url: new URL(entry.path, PUBLIC_SITE.origin).toString(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
```

- [ ] **Step 7: robots와 sitemap 테스트 통과 확인**

Run:

```bash
npx vitest run src/lib/public-site-metadata.test.ts src/app/robots.test.ts src/app/sitemap.test.ts
```

Expected: 모든 관련 테스트 PASS.

- [ ] **Step 8: 탐색 경로 커밋**

```bash
git add src/lib/public-site-metadata.ts src/lib/public-site-metadata.test.ts src/app/robots.ts src/app/robots.test.ts src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "feat(seo): 공개 크롤링 경로 명시" -m "- robots에서 공개 페이지 허용과 앱 경로 제외 규칙을 구성
- 검토 가능한 공개 페이지를 sitemap에 등록"
```

---

## Task 7: 로그인 Suspense fallback에도 의미 있는 정적 HTML 제공

**Files:**

- Modify: `src/app/login/page.tsx`
- Create: `src/app/login/page.test.tsx`

- [ ] **Step 1: 로그인 fallback 서버 HTML 테스트 작성**

`src/app/login/page.test.tsx`를 만든다.

```tsx
import type { ImgHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- 테스트에서는 전달 속성을 그대로 확인한다.
    return <img {...props} />;
  },
}));

import { LoginFallback } from "@/app/login/page";

describe("LoginFallback", () => {
  it("renders meaningful non-interactive login HTML", () => {
    const html = renderToStaticMarkup(<LoginFallback />);

    expect(html).toContain("로그인하고 여행 계획을 이어가세요");
    expect(html).toContain("Google로 계속하기");
    expect(html).toContain('href="/"');
    expect(html).toContain("disabled");
    expect(html).toContain('aria-disabled="true"');
  });
});
```

- [ ] **Step 2: 기존 스피너 fallback 때문에 테스트가 실패하는지 확인**

Run:

```bash
npx vitest run src/app/login/page.test.tsx
```

Expected: `LoginFallback`이 export되지 않았거나 스피너만 렌더링하여 FAIL.

- [ ] **Step 3: 로그인 셸을 공통 컴포넌트로 추출**

`src/app/login/page.tsx`에서 `AuthFlowSpinner` import를 제거한다.

`GoogleMark` 아래에 다음 셸을 추가한다.

```tsx
function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-bubble-gray/80 via-white to-white px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(241,45,51,0.08),_transparent_55%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-[600px] rounded-3xl border border-gray-border bg-white/95 p-8 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <Link
          href="/"
          aria-label="우때 홈으로 돌아가기"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-dark-gray outline-none ring-offset-2 transition hover:bg-bubble-gray/80 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-brand-red"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <BrandLogo alt="" style={{ width: 116, height: 66 }} />
            <p className="text-[17px] leading-relaxed text-dark-gray">
              로그인하고 여행 계획을 이어가세요!
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 기존 OAuth 내용을 공통 셸 안에 유지**

`LoginPageContent`의 반환값에서 중복된 외곽 마크업을 제거하고 다음처럼 구성한다.

```tsx
return (
  <LoginShell>
    {errorMessage && (
      <LoginErrorAlert message={errorMessage} onDismiss={clearError} />
    )}
    <button
      type="button"
      onClick={handleContinueWithGoogle}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-border bg-white px-4 py-3 text-lg font-medium text-[#1f1f1f] shadow-sm transition hover:bg-bubble-gray/60 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <GoogleMark className="h-5 w-5 shrink-0" />
      <span>Google로 계속하기</span>
    </button>
  </LoginShell>
);
```

OAuth 상태 생성, 세션 저장, 오류 처리 함수는 변경하지 않는다.

- [ ] **Step 5: 정적 fallback 구현**

`LoginFallback`을 export하고 동작하지 않는 버튼임을 명시한다.

```tsx
export function LoginFallback() {
  return (
    <LoginShell>
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="flex w-full cursor-wait items-center justify-center gap-3 rounded-xl border border-gray-border bg-white px-4 py-3 text-lg font-medium text-[#1f1f1f] opacity-70 shadow-sm"
      >
        <GoogleMark className="h-5 w-5 shrink-0" />
        <span>Google로 계속하기</span>
      </button>
    </LoginShell>
  );
}
```

- [ ] **Step 6: 로그인 fallback 테스트 통과 확인**

Run:

```bash
npx vitest run src/app/login/page.test.tsx
```

Expected: 1 test PASS.

- [ ] **Step 7: 로그인 fallback 커밋**

```bash
git add src/app/login/page.tsx src/app/login/page.test.tsx
git commit -m "fix(login): 초기 HTML에 로그인 안내 제공" -m "- Suspense fallback에서도 브랜드와 Google 로그인 문구를 노출
- hydration 전 버튼은 비활성 상태로 명확히 표시"
```

---

## Task 8: 전체 회귀·빌드·브라우저 검증

**Files:**

- Verify only: all files changed in Tasks 1–7

- [ ] **Step 1: 변경 범위의 집중 테스트 실행**

Run:

```bash
npx vitest run src/lib/public-site.test.ts src/lib/landing/landing-content.test.ts src/app/_components/LandingStaticSections.test.tsx src/app/_components/LandingView.test.tsx src/lib/product/product-tour-content.test.ts src/app/product/_components/ProductTourView.test.tsx src/lib/public-site-metadata.test.ts src/components/seo/StructuredData.test.tsx src/app/robots.test.ts src/app/sitemap.test.ts src/app/login/page.test.tsx
```

Expected: 모든 집중 테스트 PASS.

- [ ] **Step 2: 전체 테스트 실행**

Run:

```bash
npm test
```

Expected: 전체 Vitest suite PASS.

- [ ] **Step 3: 정적 검사와 프로덕션 빌드 실행**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run build
git diff --check origin/dev...HEAD
```

Expected: lint, TypeScript, production build, whitespace 검사 모두 성공.

- [ ] **Step 4: 변경 내용에서 금지 문구와 가짜 상호작용이 없는지 확인**

Run:

```bash
git diff --unified=0 origin/dev...HEAD | rg -n "예약 수수료|투자 유치|Join Waitlist|Request a Demo|Beta Access"
```

Expected: 검색 결과 없음.

Run:

```bash
rg -n "LandingMotion|opacity-0|initial=.*hidden" src/app/product
```

Expected: 검색 결과 없음.

- [ ] **Step 5: 로컬 프로덕션 서버에서 공개 경로 확인**

한 터미널에서 실행한다.

```bash
npm run start -- --hostname 127.0.0.1 --port 58130
```

다른 터미널에서 실행한다.

```bash
curl -fsS http://127.0.0.1:58130/
curl -fsS http://127.0.0.1:58130/product
curl -fsS http://127.0.0.1:58130/login
curl -fsS http://127.0.0.1:58130/robots.txt
curl -fsS http://127.0.0.1:58130/sitemap.xml
```

Expected: 모두 HTTP 200. `/`에는 출시·회사·공동창업자 정보, `/product`에는 6개 화면과 전체 흐름, `/login`에는 로그인 안내, robots와 sitemap에는 canonical 운영 도메인이 포함된다.

- [ ] **Step 6: Googlebot User-Agent로 핵심 공개 HTML 확인**

Run:

```bash
curl -fsS -A "Googlebot/2.1 (+http://www.google.com/bot.html)" http://127.0.0.1:58130/
curl -fsS -A "Googlebot/2.1 (+http://www.google.com/bot.html)" http://127.0.0.1:58130/product
curl -fsS -A "Googlebot/2.1 (+http://www.google.com/bot.html)" http://127.0.0.1:58130/login
```

Expected: 일반 요청과 동일한 핵심 텍스트가 초기 HTML에 존재하고 인증 리디렉션이 발생하지 않는다.

- [ ] **Step 7: 데스크톱·모바일 시각 검증**

브라우저에서 `/`와 `/product`를 각각 데스크톱과 모바일 viewport로 확인한다.

확인 항목:

- 헤더 로그인 버튼이 항상 보인다.
- 데스크톱 헤더에서 `제품 둘러보기`가 `/product`로 이동한다.
- `/product`의 랜딩 앵커 링크가 `/#features`, `/#how-it-works`, `/#team`으로 이동한다.
- 6개 스크린샷이 잘리지 않고 원래 비율을 유지한다.
- 가로 스크롤이 없다.
- 핵심 콘텐츠가 애니메이션 초기 상태로 숨겨지지 않는다.
- 푸터의 정책·운영자 정보가 기존과 동일하게 보인다.

- [ ] **Step 8: 최종 작업 트리와 커밋 범위 확인**

Run:

```bash
git status --short
git log --oneline --decorate origin/dev..HEAD
git diff --stat origin/dev...HEAD
```

Expected: 작업 트리가 clean이고, 설계·계획 및 Tasks 1–7의 목적별 커밋만 존재.

---

## 배포 후 재신청 전 수동 체크리스트

이 항목은 프론트엔드 코드로 완료할 수 없으므로 구현 완료 보고에 남긴다.

- [ ] 신청 이메일이 실제 `@uttae.app` 주소인지 확인
- [ ] 선택한 Google Cloud Billing Account 소유 이메일도 `@uttae.app`인지 확인
- [ ] 김민형 GitHub Bio와 Website에 `Co-founder of Uttae`, `https://www.uttae.app` 반영
- [ ] 박주영 GitHub Bio와 Website에 `Co-founder of Uttae`, `https://www.uttae.app` 반영
- [ ] 두 사람의 `@uttae` 조직 멤버십을 Public로 변경
- [ ] `@uttae` 조직 프로필에 공식 사이트와 두 공동창업자 링크 반영
- [ ] 사이트·GitHub·신청서의 서비스명, 설립 시점, 소재지, 역할 일치 확인
- [ ] 배포된 `/`, `/product`, `/login`, `/robots.txt`, `/sitemap.xml`을 로그아웃 상태에서 확인
- [ ] `https://uttae.app`에서 `https://www.uttae.app`으로의 리디렉션 확인
- [ ] 사이트와 GitHub 보강을 모두 완료한 후 새 신청서를 한 번에 제출
