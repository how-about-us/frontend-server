# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public landing page into a readable, screenshot-led product story that exposes the Uttae team and removes the legacy `howaboutus.app` address from published screenshots.

**Architecture:** Keep all product copy and mappings as typed static data under `src/lib/landing`, render the page as server-visible React sections without reveal-state hiding, and compose the sections from a small `LandingView`. Use reusable screenshot and story components, static anchors for navigation, and a deterministic Sharp script for the three raster URL replacements.

**Tech Stack:** Next.js 16.2.1 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4, Lucide React, Vitest, React DOM server rendering, Sharp.

## Global Constraints

- Visual direction: warm, modern product design with the existing brand red `#F12D33`.
- Use `public/brand/favicon.png` as the only mark in the upper-left header; do not render the `우때` text logo there.
- Remove BMJUA from landing-page text; use the existing global sans-serif stack.
- Hero title: approximately 40px mobile and 56–64px desktop.
- Section title: approximately 32px mobile and 40–48px desktop.
- Body text: minimum 16px mobile and 17–18px desktop; supporting labels must be at least 14px.
- Landscape screenshots keep their full aspect ratio and render up to approximately 1,080px wide on desktop.
- Portrait chat and AI screenshots render at approximately 320–360px wide on desktop and stack on mobile.
- Core copy, screenshots, and team information must be visible in server HTML without an initial `opacity: 0` state.
- Team members are 김민형 (`인프라 담당`, `https://github.com/minbros`) and 박주영 (`개발 및 운영 담당`, `https://github.com/parkjuyeong0312`).
- Replace `howaboutus.app` with `uttae.app` only in `01-hero-app.png`, `03-feature-place-share.png`, and `04-feature-plan.png`; all pixels outside the URL patch rectangle must remain identical.
- Do not change authenticated application screens, travel-planning behavior, policies, or unconfirmed business/funding information.

---

## File Structure

### Create

- `vitest.config.ts` — minimal Node-environment test configuration and `@` alias.
- `src/lib/landing/landing-content.test.ts` — copy order, team identity, and typography contract tests.
- `src/app/_components/LandingActionLink.test.tsx` — semantic anchor test for CTA links.
- `src/app/_components/LandingStaticSections.test.tsx` — server-rendered section and team-link tests.
- `src/app/_components/LandingView.test.tsx` — full landing composition smoke test.
- `src/app/_components/LandingHeader.tsx` — icon-only sticky header and anchor navigation.
- `src/app/_components/LandingHero.tsx` — centered hero copy, CTAs, and large overview screenshot.
- `src/app/_components/LandingValueStrip.tsx` — three product-value summaries.
- `src/app/_components/LandingFeatureStory.tsx` — reusable landscape screenshot chapter.
- `src/app/_components/LandingCollaborationSection.tsx` — enlarged chat and AI portrait cards.
- `src/app/_components/LandingHowItWorks.tsx` — static three-step onboarding row.
- `src/app/_components/LandingTeamSection.tsx` — public two-person team section.
- `src/app/_components/LandingFinalCta.tsx` — final login conversion section.
- `scripts/update-landing-screenshot-domain.mjs` — deterministic SVG overlay and raw-pixel validation.

### Modify

- `package.json` and `package-lock.json` — add Vitest, Sharp, test script, and screenshot-asset script.
- `src/lib/landing/landing-content.ts` — replace the old chip/split/highlight models with the approved story models.
- `src/lib/landing/landing-typography.ts` — remove `font-landing` and raise the type scale.
- `src/lib/landing/landing-screenshots.ts` — update responsive sizes and portrait frame widths.
- `src/lib/public-assets.ts` — remove the obsolete exported BMJUA mapping.
- `src/app/_components/LandingActionLink.tsx` — render a real Next.js link without `useRouter`.
- `src/app/_components/LandingView.tsx` — become a simple composition root for the new sections.
- `src/app/layout.tsx` — set document language to Korean.
- `src/components/layout/SiteFooter.tsx` — raise footer copy to a readable 14px minimum.
- `public/landing/01-hero-app.png` — URL patch only.
- `public/landing/03-feature-place-share.png` — URL patch only.
- `public/landing/04-feature-plan.png` — URL patch only.

### Delete

- `src/app/_components/LandingOnboardingCarousel.tsx` — replaced by the static three-step section.
- `src/app/_components/LandingReveal.tsx` — removes hidden-before-hydration reveal behavior.
- `src/app/_components/LandingSections.tsx` — responsibilities move to focused section files.
- `src/lib/landing/landing-font.ts` — BMJUA no longer participates in landing text.

---

### Task 1: Add the Test Harness and Typed Landing Content Contracts

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/landing/landing-content.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/lib/landing/landing-content.ts`
- Modify: `src/lib/landing/landing-typography.ts`
- Modify: `src/lib/landing/landing-screenshots.ts`

**Interfaces:**
- Produces: `LANDING_VALUES`, `LANDING_FEATURE_STORIES`, `LANDING_COLLABORATION_FEATURES`, `LANDING_HOW_STEPS`, `LANDING_TEAM_MEMBERS`, `LANDING_SECTION_PY`, `LANDING_CONTAINER_CLASS`.
- Produces types: `LandingFeatureStoryContent`, `LandingCollaborationFeature`, `LandingTeamMember`.
- Produces typography keys: `eyebrow`, `heroTitle`, `heroBody`, `sectionTitle`, `sectionBody`, `pointLabel`, `cardTitle`, `cardBody`, `ctaTitle`, `primaryAction`.
- Consumes: `LandingFeatureScreenshotKey` from `landing-screenshots.ts`.

- [ ] **Step 1: Install the two development dependencies and add scripts**

Run:

```bash
npm install --save-dev vitest sharp
```

Then add these scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "assets:landing-domain": "node scripts/update-landing-screenshot-domain.mjs"
  }
}
```

Expected: `package.json` and `package-lock.json` include Vitest and Sharp, while all existing scripts remain unchanged.

- [ ] **Step 2: Add the Vitest configuration**

Create `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 3: Write the failing content and typography tests**

Create `src/lib/landing/landing-content.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  LANDING_COLLABORATION_FEATURES,
  LANDING_FEATURE_STORIES,
  LANDING_HOW_STEPS,
  LANDING_TEAM_MEMBERS,
  LANDING_VALUES,
} from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";

describe("landing content contracts", () => {
  it("keeps the approved product story order", () => {
    expect(LANDING_VALUES.map((item) => item.title)).toEqual([
      "지도 기반 장소 탐색",
      "실시간 팀 협업",
      "여행 맥락을 아는 AI",
    ]);
    expect(LANDING_FEATURE_STORIES.map((item) => item.screenshotKey)).toEqual([
      "map",
      "placeShare",
      "plan",
    ]);
    expect(LANDING_COLLABORATION_FEATURES.map((item) => item.screenshotKey)).toEqual([
      "chat",
      "ai",
    ]);
    expect(LANDING_HOW_STEPS).toHaveLength(3);
  });

  it("publishes the approved team identities", () => {
    expect(LANDING_TEAM_MEMBERS).toEqual([
      {
        name: "김민형",
        role: "인프라 담당",
        description:
          "우때가 안정적으로 배포되고 운영될 수 있도록 서비스 인프라를 설계하고 관리합니다.",
        githubUrl: "https://github.com/minbros",
        githubLabel: "minbros",
      },
      {
        name: "박주영",
        role: "개발 및 운영 담당",
        description:
          "우때의 제품 개발과 사용자에게 제공되는 서비스 운영 전반을 담당합니다.",
        githubUrl: "https://github.com/parkjuyeong0312",
        githubLabel: "parkjuyeong0312",
      },
    ]);
  });

  it("does not use the landing display font in text styles", () => {
    const classNames = Object.values(landingTypography).join(" ");
    expect(classNames).not.toContain("font-landing");
    expect(landingTypography.heroBody).toContain("text-base");
    expect(landingTypography.sectionBody).toContain("text-base");
  });
});
```

- [ ] **Step 4: Run the test and verify it fails**

Run:

```bash
npm test -- src/lib/landing/landing-content.test.ts
```

Expected: FAIL because the new content constants and `sectionBody` typography key do not exist.

- [ ] **Step 5: Replace the landing content model**

Replace `src/lib/landing/landing-content.ts` with:

```ts
import {
  Bot,
  LogIn,
  MapPin,
  MessageCircle,
  Route,
  Send,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { LandingFeatureScreenshotKey } from "@/lib/landing/landing-screenshots";

type LandingValue = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type LandingFeatureStoryContent = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  points: readonly string[];
  screenshotKey: Extract<LandingFeatureScreenshotKey, "map" | "placeShare" | "plan">;
};

export type LandingCollaborationFeature = {
  title: string;
  eyebrow: string;
  description: string;
  screenshotKey: Extract<LandingFeatureScreenshotKey, "chat" | "ai">;
  icon: LucideIcon;
};

type LandingHowStep = {
  step: string;
  title: string;
  icon: LucideIcon;
};

export type LandingTeamMember = {
  name: string;
  role: string;
  description: string;
  githubUrl: string;
  githubLabel: string;
};

export const LANDING_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1180px] px-5 landing-sm:px-6";
export const LANDING_SECTION_PY = "py-20 landing-lg:py-28";

export const LANDING_VALUES: readonly LandingValue[] = [
  {
    title: "지도 기반 장소 탐색",
    description: "후보 장소를 한눈에 모아요",
    icon: MapPin,
  },
  {
    title: "실시간 팀 협업",
    description: "대화와 계획이 바로 이어져요",
    icon: Users,
  },
  {
    title: "여행 맥락을 아는 AI",
    description: "추천과 요약을 함께 받아요",
    icon: Bot,
  },
];

export const LANDING_FEATURE_STORIES: readonly LandingFeatureStoryContent[] = [
  {
    id: "discover",
    index: "01",
    eyebrow: "DISCOVER",
    title: "지도에서 찾고, 함께 고르기",
    description: "검색과 필터로 장소를 발견하고 팀 북마크에 모아 후보를 비교합니다.",
    points: ["카테고리별 장소 탐색", "조건에 맞는 필터", "팀 북마크 공유"],
    screenshotKey: "map",
  },
  {
    id: "connect",
    index: "02",
    eyebrow: "CONNECT",
    title: "장소 정보가 대화와 일정으로 바로 연결",
    description:
      "사진·평점·주소가 담긴 장소 카드를 채팅으로 보내고, 북마크나 일정에 곧바로 추가합니다.",
    points: ["채팅으로 보내기", "북마크에 저장", "일정에 바로 추가"],
    screenshotKey: "placeShare",
  },
  {
    id: "plan-story",
    index: "03",
    eyebrow: "PLAN",
    title: "날짜별 일정과 이동 동선을 완성",
    description:
      "체류 시간과 메모를 정리하고, 드래그로 순서를 조정하며 이동 경로까지 확인합니다.",
    points: ["날짜·시간·메모", "드래그 순서 조정", "이동수단과 지도 경로"],
    screenshotKey: "plan",
  },
];

export const LANDING_COLLABORATION_FEATURES: readonly LandingCollaborationFeature[] = [
  {
    title: "실시간 채팅",
    eyebrow: "REAL-TIME CHAT",
    description: "장소 카드를 공유하며 계획을 바로 의논합니다.",
    screenshotKey: "chat",
    icon: MessageCircle,
  },
  {
    title: "팀과 함께 쓰는 AI",
    eyebrow: "WOORI AI",
    description: "대화 맥락에 맞는 추천과 긴 대화의 요약을 받습니다.",
    screenshotKey: "ai",
    icon: Send,
  },
];

export const LANDING_HOW_STEPS: readonly LandingHowStep[] = [
  { step: "01", title: "로그인하고 여행 방 만들기", icon: LogIn },
  { step: "02", title: "친구를 초대해 함께 장소 고르기", icon: UserPlus },
  { step: "03", title: "일정과 이동 동선 완성하기", icon: Route },
];

export const LANDING_TEAM_MEMBERS: readonly LandingTeamMember[] = [
  {
    name: "김민형",
    role: "인프라 담당",
    description:
      "우때가 안정적으로 배포되고 운영될 수 있도록 서비스 인프라를 설계하고 관리합니다.",
    githubUrl: "https://github.com/minbros",
    githubLabel: "minbros",
  },
  {
    name: "박주영",
    role: "개발 및 운영 담당",
    description: "우때의 제품 개발과 사용자에게 제공되는 서비스 운영 전반을 담당합니다.",
    githubUrl: "https://github.com/parkjuyeong0312",
    githubLabel: "parkjuyeong0312",
  },
];
```

- [ ] **Step 6: Replace the typography scale**

Replace `src/lib/landing/landing-typography.ts` with:

```ts
const body =
  "font-sans text-base font-medium leading-[1.75] text-dark-gray landing-sm:text-lg";

export const landingTypography = {
  eyebrow:
    "font-sans text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red",
  heroTitle:
    "font-sans text-[2.5rem] font-extrabold leading-[1.08] tracking-[-0.055em] text-black landing-sm:text-5xl landing-lg:text-6xl",
  heroBody: body,
  sectionTitle:
    "font-sans text-[2rem] font-bold leading-[1.18] tracking-[-0.04em] text-black landing-sm:text-4xl landing-lg:text-5xl",
  sectionBody: body,
  pointLabel:
    "font-sans text-sm font-semibold leading-relaxed text-dark-gray landing-sm:text-base",
  cardTitle:
    "font-sans text-2xl font-bold leading-tight tracking-[-0.035em] text-black landing-sm:text-3xl",
  cardBody:
    "font-sans text-base font-medium leading-[1.7] text-dark-gray landing-sm:text-[1.0625rem]",
  ctaTitle:
    "font-sans text-[2rem] font-bold leading-tight tracking-[-0.04em] text-black landing-sm:text-4xl",
  primaryAction: "font-sans text-base font-bold landing-sm:text-lg",
} as const;
```

- [ ] **Step 7: Enlarge screenshot responsive metadata**

In `src/lib/landing/landing-screenshots.ts`, change the responsive constants and portrait entries to:

```ts
export const LANDING_HERO_SCREENSHOT_SIZES =
  "(max-width: 1180px) calc(100vw - 40px), 1080px";

export const LANDING_FEATURE_SCREENSHOT_SIZES =
  "(max-width: 1180px) calc(100vw - 40px), 1080px";

// chat
frameMaxWidthClass: "max-w-[320px] landing-lg:max-w-[360px]",

// ai
frameMaxWidthClass: "max-w-[320px] landing-lg:max-w-[360px]",

export const LANDING_FRAMED_SCREENSHOT_SIZES =
  "(max-width: 720px) 82vw, 360px";
```

- [ ] **Step 8: Run the content test and full lint**

Run:

```bash
npm test -- src/lib/landing/landing-content.test.ts
npm run lint
```

Expected: content test PASS and ESLint exits with code 0.

- [ ] **Step 9: Commit the content contracts**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/landing/landing-content.ts src/lib/landing/landing-content.test.ts src/lib/landing/landing-typography.ts src/lib/landing/landing-screenshots.ts
git commit -m "test: define landing redesign contracts"
```

---

### Task 2: Build the Static Header, Hero, and Value Strip

**Files:**
- Create: `src/app/_components/LandingActionLink.test.tsx`
- Create: `src/app/_components/LandingHeader.tsx`
- Create: `src/app/_components/LandingHero.tsx`
- Create: `src/app/_components/LandingValueStrip.tsx`
- Modify: `src/app/_components/LandingActionLink.tsx`

**Interfaces:**
- Consumes: `LANDING_VALUES`, `LANDING_CONTAINER_CLASS`, `LANDING_HERO_SCREENSHOT`, `landingTypography`.
- Produces: `LandingHeader(): JSX.Element`, `LandingHero(): JSX.Element`, `LandingValueStrip(): JSX.Element`.
- Produces: `LandingActionLink({ href, children, className }): JSX.Element` as a server-renderable anchor.

- [ ] **Step 1: Write the failing semantic CTA test**

Create `src/app/_components/LandingActionLink.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingActionLink } from "@/app/_components/LandingActionLink";

describe("LandingActionLink", () => {
  it("renders an addressable anchor in server HTML", () => {
    const html = renderToStaticMarkup(
      <LandingActionLink href="/login">무료로 시작하기</LandingActionLink>,
    );

    expect(html).toContain('<a href="/login"');
    expect(html).toContain("무료로 시작하기");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- src/app/_components/LandingActionLink.test.tsx
```

Expected: FAIL because the current component renders a `<button>` without an `href`.

- [ ] **Step 3: Refactor the CTA into a real link**

Replace `src/app/_components/LandingActionLink.tsx` with:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function LandingActionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full border border-transparent bg-brand-red px-5 py-2.5 font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 4: Create the icon-only header**

Create `src/app/_components/LandingHeader.tsx`:

```tsx
import Link from "next/link";

import { LandingActionLink } from "@/app/_components/LandingActionLink";
import { BrandLogo } from "@/components/BrandLogo";
import { LANDING_CONTAINER_CLASS } from "@/lib/landing/landing-content";

const navItems = [
  { href: "#features", label: "기능" },
  { href: "#how-it-works", label: "사용 방법" },
  { href: "#team", label: "팀" },
] as const;

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-border/60 bg-white/90 font-sans backdrop-blur-md">
      <div className={`${LANDING_CONTAINER_CLASS} flex items-center justify-between gap-4 py-3`}>
        <Link href="/" aria-label="우때 홈" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">
          <BrandLogo
            alt=""
            variant="favicon"
            aria-hidden
            style={{ width: "clamp(36px, 4vw, 42px)", height: "clamp(36px, 4vw, 42px)" }}
          />
        </Link>
        <nav aria-label="랜딩 페이지" className="ml-auto hidden items-center gap-7 landing-sm:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-dark-gray transition hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <LandingActionLink href="/login" className="px-5 py-2.5 text-sm">
          로그인
        </LandingActionLink>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create the centered hero**

Create `src/app/_components/LandingHero.tsx`:

```tsx
import { LandingActionLink } from "@/app/_components/LandingActionLink";
import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import { LANDING_CONTAINER_CLASS } from "@/lib/landing/landing-content";
import {
  LANDING_HERO_SCREENSHOT,
  LANDING_HERO_SCREENSHOT_SIZES,
} from "@/lib/landing/landing-screenshots";
import { landingTypography } from "@/lib/landing/landing-typography";

export function LandingHero() {
  return (
    <section className="bg-[radial-gradient(circle_at_50%_12%,rgba(241,45,51,0.11),transparent_35%)] pt-20 pb-10 landing-lg:pt-28 landing-lg:pb-14">
      <div className={`${LANDING_CONTAINER_CLASS} text-center`}>
        <p className={landingTypography.eyebrow}>REAL-TIME TRAVEL PLANNER</p>
        <h1 className={`${landingTypography.heroTitle} mx-auto mt-4 max-w-4xl`}>
          흩어진 여행 계획을
          <br />
          한곳에서, 함께.
        </h1>
        <p className={`${landingTypography.heroBody} mx-auto mt-5 max-w-2xl`}>
          장소를 찾고, 대화하고, 일정을 짜는 모든 과정을 친구들과 실시간으로 완성하세요.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <LandingActionLink href="/login" className="px-7 py-3">
            무료로 시작하기
          </LandingActionLink>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-full border border-gray-border bg-white px-7 py-3 text-base font-bold text-dark-gray transition hover:border-brand-red/40 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
          >
            기능 둘러보기
          </a>
        </div>
        <div className="mx-auto mt-12 max-w-[1080px] overflow-hidden rounded-2xl border border-gray-border bg-white p-2 shadow-[0_24px_70px_-28px_rgba(71,31,33,0.28)] landing-sm:p-3">
          <LandingScreenshot
            screenshot={LANDING_HERO_SCREENSHOT}
            priority
            sizes={LANDING_HERO_SCREENSHOT_SIZES}
            className="rounded-xl"
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create the value strip**

Create `src/app/_components/LandingValueStrip.tsx`:

```tsx
import { LANDING_CONTAINER_CLASS, LANDING_VALUES } from "@/lib/landing/landing-content";

export function LandingValueStrip() {
  return (
    <section aria-label="우때 핵심 가치" className="border-y border-gray-border bg-white">
      <div className={`${LANDING_CONTAINER_CLASS} grid landing-sm:grid-cols-3`}>
        {LANDING_VALUES.map(({ icon: Icon, title, description }, index) => (
          <article
            key={title}
            className={`flex items-center gap-4 py-6 landing-sm:justify-center landing-sm:px-5 ${index > 0 ? "border-t border-gray-border landing-sm:border-t-0 landing-sm:border-l" : ""}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-bold text-black">{title}</h2>
              <p className="mt-1 text-sm font-medium text-dark-gray">{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Run the semantic test and lint**

Run:

```bash
npm test -- src/app/_components/LandingActionLink.test.tsx
npm run lint
```

Expected: PASS and ESLint exits with code 0.

- [ ] **Step 8: Commit the static landing foundation**

```bash
git add src/app/_components/LandingActionLink.tsx src/app/_components/LandingActionLink.test.tsx src/app/_components/LandingHeader.tsx src/app/_components/LandingHero.tsx src/app/_components/LandingValueStrip.tsx
git commit -m "feat: add landing hero foundation"
```

---

### Task 3: Build the Product Story, Onboarding, Team, and Final CTA Sections

**Files:**
- Create: `src/app/_components/LandingStaticSections.test.tsx`
- Create: `src/app/_components/LandingFeatureStory.tsx`
- Create: `src/app/_components/LandingCollaborationSection.tsx`
- Create: `src/app/_components/LandingHowItWorks.tsx`
- Create: `src/app/_components/LandingTeamSection.tsx`
- Create: `src/app/_components/LandingFinalCta.tsx`

**Interfaces:**
- Consumes: all typed content constants from Task 1.
- Produces: `LandingFeatureStory({ story, tone })`, `LandingCollaborationSection()`, `LandingHowItWorks()`, `LandingTeamSection()`, `LandingFinalCta()`.
- `LandingTeamSection` must emit exact external URLs with `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 1: Write the failing static section tests**

Create `src/app/_components/LandingStaticSections.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingHowItWorks } from "@/app/_components/LandingHowItWorks";
import { LandingTeamSection } from "@/app/_components/LandingTeamSection";

describe("landing static sections", () => {
  it("renders all onboarding steps at once", () => {
    const html = renderToStaticMarkup(<LandingHowItWorks />);
    expect(html).toContain("로그인하고 여행 방 만들기");
    expect(html).toContain("친구를 초대해 함께 장소 고르기");
    expect(html).toContain("일정과 이동 동선 완성하기");
    expect(html).not.toContain('role="tablist"');
  });

  it("renders the approved team and GitHub links", () => {
    const html = renderToStaticMarkup(<LandingTeamSection />);
    expect(html).toContain("김민형");
    expect(html).toContain("인프라 담당");
    expect(html).toContain('href="https://github.com/minbros"');
    expect(html).toContain("박주영");
    expect(html).toContain("개발 및 운영 담당");
    expect(html).toContain('href="https://github.com/parkjuyeong0312"');
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
    expect(html.match(/rel="noreferrer"/g)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- src/app/_components/LandingStaticSections.test.tsx
```

Expected: FAIL because `LandingHowItWorks` and `LandingTeamSection` do not exist.

- [ ] **Step 3: Create the reusable landscape story**

Create `src/app/_components/LandingFeatureStory.tsx`:

```tsx
import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import {
  LANDING_CONTAINER_CLASS,
  LANDING_SECTION_PY,
  type LandingFeatureStoryContent,
} from "@/lib/landing/landing-content";
import {
  LANDING_FEATURE_SCREENSHOTS,
  LANDING_FEATURE_SCREENSHOT_SIZES,
} from "@/lib/landing/landing-screenshots";
import { landingTypography } from "@/lib/landing/landing-typography";

export function LandingFeatureStory({
  story,
  tone,
}: {
  story: LandingFeatureStoryContent;
  tone: "white" | "tint";
}) {
  const screenshot = LANDING_FEATURE_SCREENSHOTS[story.screenshotKey];

  return (
    <section
      id={story.id}
      className={`scroll-mt-24 border-t border-gray-border/50 ${LANDING_SECTION_PY} ${tone === "tint" ? "bg-brand-red/[0.035]" : "bg-white"}`}
    >
      <div className={LANDING_CONTAINER_CLASS}>
        <div className="mx-auto max-w-3xl text-center">
          <p className={landingTypography.eyebrow}>{story.index} · {story.eyebrow}</p>
          <h2 className={`${landingTypography.sectionTitle} mt-3`}>{story.title}</h2>
          <p className={`${landingTypography.sectionBody} mt-4`}>{story.description}</p>
        </div>
        <div className="mx-auto mt-10 max-w-[1080px] overflow-hidden rounded-2xl border border-gray-border bg-white p-2 shadow-[0_20px_55px_-30px_rgba(71,31,33,0.24)] landing-sm:p-3">
          <LandingScreenshot
            screenshot={screenshot}
            sizes={LANDING_FEATURE_SCREENSHOT_SIZES}
            className="rounded-xl"
          />
        </div>
        <ul className="mx-auto mt-6 grid max-w-4xl gap-3 landing-sm:grid-cols-3">
          {story.points.map((point) => (
            <li key={point} className={`${landingTypography.pointLabel} rounded-xl border border-gray-border bg-white px-4 py-3 text-center`}>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create the enlarged collaboration section**

Create `src/app/_components/LandingCollaborationSection.tsx`:

```tsx
import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import {
  LANDING_COLLABORATION_FEATURES,
  LANDING_CONTAINER_CLASS,
  LANDING_SECTION_PY,
} from "@/lib/landing/landing-content";
import {
  LANDING_FEATURE_SCREENSHOTS,
  LANDING_FRAMED_SCREENSHOT_SIZES,
} from "@/lib/landing/landing-screenshots";
import { landingTypography } from "@/lib/landing/landing-typography";

export function LandingCollaborationSection() {
  return (
    <section className={`border-t border-gray-border/50 bg-white ${LANDING_SECTION_PY}`} aria-labelledby="collaboration-heading">
      <div className={LANDING_CONTAINER_CLASS}>
        <div className="mx-auto max-w-3xl text-center">
          <p className={landingTypography.eyebrow}>04 · COLLABORATE</p>
          <h2 id="collaboration-heading" className={`${landingTypography.sectionTitle} mt-3`}>
            대화도, AI도 같은 여행방에서
          </h2>
          <p className={`${landingTypography.sectionBody} mt-4`}>
            장소를 공유하고 의논하는 순간부터 여행 맥락을 이해하는 AI까지 한곳에서 이어집니다.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 landing-lg:grid-cols-2">
          {LANDING_COLLABORATION_FEATURES.map(({ icon: Icon, ...feature }) => (
            <article key={feature.title} className="grid min-h-[30rem] items-center gap-6 overflow-hidden rounded-3xl border border-gray-border bg-gradient-to-br from-white to-brand-red/[0.045] px-6 pt-8 landing-sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.95fr)] landing-sm:pr-4 landing-sm:pb-0">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className={`${landingTypography.eyebrow} mt-5`}>{feature.eyebrow}</p>
                <h3 className={`${landingTypography.cardTitle} mt-2`}>{feature.title}</h3>
                <p className={`${landingTypography.cardBody} mt-3`}>{feature.description}</p>
              </div>
              <div className="self-end">
                <LandingScreenshot
                  screenshot={LANDING_FEATURE_SCREENSHOTS[feature.screenshotKey]}
                  sizes={LANDING_FRAMED_SCREENSHOT_SIZES}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create the static onboarding row**

Create `src/app/_components/LandingHowItWorks.tsx`:

```tsx
import {
  LANDING_CONTAINER_CLASS,
  LANDING_HOW_STEPS,
  LANDING_SECTION_PY,
} from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className={`scroll-mt-24 border-t border-gray-border/50 bg-brand-red/[0.035] ${LANDING_SECTION_PY}`} aria-labelledby="how-heading">
      <div className={LANDING_CONTAINER_CLASS}>
        <div className="text-center">
          <p className={landingTypography.eyebrow}>HOW IT WORKS</p>
          <h2 id="how-heading" className={`${landingTypography.sectionTitle} mt-3`}>3단계면 충분해요</h2>
        </div>
        <ol className="mt-10 grid gap-4 landing-sm:grid-cols-3">
          {LANDING_HOW_STEPS.map(({ icon: Icon, step, title }) => (
            <li key={step} className="rounded-2xl border border-gray-border bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-extrabold text-brand-red/70">{step}</span>
              </div>
              <h3 className="mt-6 text-lg font-bold leading-snug text-black">{title}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create the team section**

Create `src/app/_components/LandingTeamSection.tsx`:

```tsx
import { Github } from "lucide-react";

import {
  LANDING_CONTAINER_CLASS,
  LANDING_SECTION_PY,
  LANDING_TEAM_MEMBERS,
} from "@/lib/landing/landing-content";

export function LandingTeamSection() {
  return (
    <section id="team" className={`scroll-mt-24 bg-[#211719] text-white ${LANDING_SECTION_PY}`} aria-labelledby="team-heading">
      <div className={LANDING_CONTAINER_CLASS}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#ff8589]">TEAM UTTAE</p>
          <h2 id="team-heading" className="mt-3 text-[2rem] font-bold leading-tight tracking-[-0.04em] landing-sm:text-4xl landing-lg:text-5xl">우때를 만드는 사람들</h2>
          <p className="mt-4 text-base font-medium leading-[1.75] text-white/65 landing-sm:text-lg">더 나은 여행 계획 경험을 만들고 안정적으로 운영합니다.</p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 landing-sm:grid-cols-2">
          {LANDING_TEAM_MEMBERS.map((member) => (
            <article key={member.name} className="rounded-2xl border border-white/15 bg-white/[0.06] p-7">
              <p className="text-sm font-extrabold text-[#ff8589]">{member.role}</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{member.name}</h3>
              <p className="mt-3 min-h-[5rem] text-base font-medium leading-[1.7] text-white/65">{member.description}</p>
              <a
                href={member.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white transition hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Github className="h-4 w-4" aria-hidden />
                GitHub · {member.githubLabel}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create the final CTA**

Create `src/app/_components/LandingFinalCta.tsx`:

```tsx
import { LandingActionLink } from "@/app/_components/LandingActionLink";
import { LANDING_CONTAINER_CLASS, LANDING_SECTION_PY } from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";

export function LandingFinalCta() {
  return (
    <section className={`border-t border-gray-border bg-white ${LANDING_SECTION_PY}`}>
      <div className={`${LANDING_CONTAINER_CLASS} text-center`}>
        <h2 className={landingTypography.ctaTitle}>지금, 함께 여행을 계획해보세요.</h2>
        <p className={`${landingTypography.sectionBody} mx-auto mt-4 max-w-2xl`}>
          로그인하고 여행 방을 만들면 친구를 초대해 바로 계획을 시작할 수 있어요.
        </p>
        <LandingActionLink href="/login" className="mt-7 px-7 py-3">
          무료로 시작하기
        </LandingActionLink>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Run section tests and lint**

Run:

```bash
npm test -- src/app/_components/LandingStaticSections.test.tsx
npm run lint
```

Expected: PASS and ESLint exits with code 0.

- [ ] **Step 9: Commit the landing sections**

```bash
git add src/app/_components/LandingFeatureStory.tsx src/app/_components/LandingCollaborationSection.tsx src/app/_components/LandingHowItWorks.tsx src/app/_components/LandingTeamSection.tsx src/app/_components/LandingFinalCta.tsx src/app/_components/LandingStaticSections.test.tsx
git commit -m "feat: add landing product story sections"
```

---

### Task 4: Compose the New Page and Remove the Hidden Legacy Structure

**Files:**
- Create: `src/app/_components/LandingView.test.tsx`
- Modify: `src/app/_components/LandingView.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/SiteFooter.tsx`
- Modify: `src/lib/public-assets.ts`
- Delete: `src/app/_components/LandingOnboardingCarousel.tsx`
- Delete: `src/app/_components/LandingReveal.tsx`
- Delete: `src/app/_components/LandingSections.tsx`
- Delete: `src/lib/landing/landing-font.ts`

**Interfaces:**
- Consumes every section component from Tasks 2 and 3.
- Produces the public `LandingView` with `#features`, `#how-it-works`, and `#team` destinations.
- Removes every runtime dependency on `font-landing` and the reveal components.

- [ ] **Step 1: Write the failing full-page smoke test**

Create `src/app/_components/LandingView.test.tsx`:

```tsx
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

    // eslint-disable-next-line @next/next/no-img-element
    return <img {...imageProps} />;
  },
}));

import { LandingView } from "@/app/_components/LandingView";

describe("LandingView", () => {
  it("renders the approved story and team in server HTML", () => {
    const html = renderToStaticMarkup(<LandingView />);

    expect(html).toContain("흩어진 여행 계획을");
    expect(html).toContain('id="features"');
    expect(html).toContain('id="how-it-works"');
    expect(html).toContain('id="team"');
    expect(html).toContain("김민형");
    expect(html).toContain("박주영");
    expect(html).not.toContain("font-landing");
    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("text-[11px]");
  });
});
```

- [ ] **Step 2: Run the smoke test and verify it fails**

Run:

```bash
npm test -- src/app/_components/LandingView.test.tsx
```

Expected: FAIL because the current page does not expose the approved anchors or team.

- [ ] **Step 3: Replace `LandingView` with the composition root**

Replace `src/app/_components/LandingView.tsx` with:

```tsx
import { LandingCollaborationSection } from "@/app/_components/LandingCollaborationSection";
import { LandingFeatureStory } from "@/app/_components/LandingFeatureStory";
import { LandingFinalCta } from "@/app/_components/LandingFinalCta";
import { LandingHeader } from "@/app/_components/LandingHeader";
import { LandingHero } from "@/app/_components/LandingHero";
import { LandingHowItWorks } from "@/app/_components/LandingHowItWorks";
import { LandingTeamSection } from "@/app/_components/LandingTeamSection";
import { LandingValueStrip } from "@/app/_components/LandingValueStrip";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LANDING_FEATURE_STORIES } from "@/lib/landing/landing-content";

export function LandingView() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white font-sans">
      <LandingHeader />
      <main className="relative z-10 flex flex-1 flex-col antialiased">
        <LandingHero />
        <LandingValueStrip />
        <div id="features" className="scroll-mt-24">
          {LANDING_FEATURE_STORIES.map((story, index) => (
            <LandingFeatureStory
              key={story.id}
              story={story}
              tone={index % 2 === 0 ? "white" : "tint"}
            />
          ))}
        </div>
        <LandingCollaborationSection />
        <LandingHowItWorks />
        <LandingTeamSection />
        <LandingFinalCta />
      </main>
      <SiteFooter className="font-sans" />
    </div>
  );
}
```

- [ ] **Step 4: Set the document language and remove the obsolete font export**

In `src/app/layout.tsx`, change:

```tsx
<html lang="ko" className={`${inter.variable} h-full`}>
```

In `src/lib/public-assets.ts`, delete the `fontFiles` export and its comment. Keep `brandAssets`, `sidebarIcons`, `chatAssets`, and `landingAssetDir` unchanged.

In `src/components/layout/SiteFooter.tsx`, replace the three footer text-size combinations (`text-[11px] sm:text-xs`) with `text-sm`. Do not change the footer's policy links, operator details, email, hosting disclosure, or copyright content.

- [ ] **Step 5: Delete the replaced landing files**

Delete exactly these files after confirming `rg` reports no remaining imports:

```text
src/app/_components/LandingOnboardingCarousel.tsx
src/app/_components/LandingReveal.tsx
src/app/_components/LandingSections.tsx
src/lib/landing/landing-font.ts
```

Run:

```bash
rg -n "LandingReveal|LandingOnboardingCarousel|LandingSections|landing-font|font-landing" src
```

Expected: no matches.

- [ ] **Step 6: Run the page test, all tests, lint, and build**

Run:

```bash
npm test -- src/app/_components/LandingView.test.tsx
npm test
npm run lint
npm run build
```

Expected: every command exits with code 0; the smoke test confirms no hidden initial state.

- [ ] **Step 7: Commit the composed page**

```bash
git add src/app/_components/LandingView.tsx src/app/_components/LandingView.test.tsx src/app/layout.tsx src/components/layout/SiteFooter.tsx src/lib/public-assets.ts src/app/_components/LandingOnboardingCarousel.tsx src/app/_components/LandingReveal.tsx src/app/_components/LandingSections.tsx src/lib/landing/landing-font.ts
git commit -m "feat: rebuild landing page composition"
```

---

### Task 5: Replace the Legacy Domain in Three PNG Assets

**Files:**
- Create: `scripts/update-landing-screenshot-domain.mjs`
- Modify: `public/landing/01-hero-app.png`
- Modify: `public/landing/03-feature-place-share.png`
- Modify: `public/landing/04-feature-plan.png`

**Interfaces:**
- Consumes: Sharp `composite([{ input, left, top, blend }])`, `ensureAlpha().raw().toBuffer({ resolveWithObject: true })`.
- Produces: three `2920 × 1934` PNG files whose raw pixels differ only inside `DOMAIN_PATCH`.
- Produces command: `npm run assets:landing-domain`.

- [ ] **Step 1: Record the original dimensions and hashes**

Run:

```bash
file public/landing/01-hero-app.png public/landing/03-feature-place-share.png public/landing/04-feature-plan.png
sha256sum public/landing/01-hero-app.png public/landing/03-feature-place-share.png public/landing/04-feature-plan.png
```

Expected: all three images report `2920 x 1934`. Save the hashes in the implementation notes for review.

- [ ] **Step 2: Add the deterministic Sharp script**

Create `scripts/update-landing-screenshot-domain.mjs`:

```js
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const TARGETS = [
  "public/landing/01-hero-app.png",
  "public/landing/03-feature-place-share.png",
  "public/landing/04-feature-plan.png",
];
const EXPECTED_SIZE = { width: 2920, height: 1934 };
const DOMAIN_PATCH = { left: 1288, top: 96, width: 344, height: 64 };

function pixelOffset(info, x, y) {
  return (y * info.width + x) * info.channels;
}

function assertOutsidePatchIsIdentical(original, edited, info) {
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const insidePatch =
        x >= DOMAIN_PATCH.left &&
        x < DOMAIN_PATCH.left + DOMAIN_PATCH.width &&
        y >= DOMAIN_PATCH.top &&
        y < DOMAIN_PATCH.top + DOMAIN_PATCH.height;
      if (insidePatch) continue;

      const offset = pixelOffset(info, x, y);
      for (let channel = 0; channel < info.channels; channel += 1) {
        if (original[offset + channel] !== edited[offset + channel]) {
          throw new Error(`Unexpected pixel change outside URL patch at ${x},${y}`);
        }
      }
    }
  }
}

function createOverlay(background) {
  const fill = `rgb(${background[0]},${background[1]},${background[2]})`;
  return Buffer.from(`
    <svg width="${DOMAIN_PATCH.width}" height="${DOMAIN_PATCH.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${fill}" />
      <text x="50%" y="43" text-anchor="middle" fill="#f6f6f6"
        font-family="Arial, sans-serif" font-size="30" font-weight="600">uttae.app</text>
    </svg>
  `);
}

for (const relativePath of TARGETS) {
  const filePath = path.join(ROOT, relativePath);
  const input = await readFile(filePath);
  const { data: originalRaw, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== EXPECTED_SIZE.width || info.height !== EXPECTED_SIZE.height) {
    throw new Error(`${relativePath} has unexpected size ${info.width}x${info.height}`);
  }

  const sampleOffset = pixelOffset(info, DOMAIN_PATCH.left + 6, DOMAIN_PATCH.top + 6);
  const background = originalRaw.subarray(sampleOffset, sampleOffset + 3);
  const output = await sharp(input)
    .composite([
      {
        input: createOverlay(background),
        left: DOMAIN_PATCH.left,
        top: DOMAIN_PATCH.top,
        blend: "over",
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const { data: editedRaw, info: editedInfo } = await sharp(output)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (
    editedInfo.width !== info.width ||
    editedInfo.height !== info.height ||
    editedInfo.channels !== info.channels
  ) {
    throw new Error(`${relativePath} changed raw image dimensions or channels`);
  }
  assertOutsidePatchIsIdentical(originalRaw, editedRaw, info);

  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, output);
  await rename(temporaryPath, filePath);
  console.log(`updated ${relativePath}`);
}
```

- [ ] **Step 3: Run the script**

Run:

```bash
npm run assets:landing-domain
```

Expected output:

```text
updated public/landing/01-hero-app.png
updated public/landing/03-feature-place-share.png
updated public/landing/04-feature-plan.png
```

If the script reports an outside-patch difference, do not relax the assertion. Correct only the composite pipeline or patch coordinates.

- [ ] **Step 4: Verify dimensions and visually inspect all three images**

Run:

```bash
file public/landing/01-hero-app.png public/landing/03-feature-place-share.png public/landing/04-feature-plan.png
```

Expected: all three still report `2920 x 1934`.

Open each PNG at original resolution and confirm:

- `uttae.app` is centered in the browser toolbar.
- No part of `howaboutus.app` remains visible.
- Toolbar background, app UI, maps, itinerary, and chat are unchanged.
- The text is not blurred, clipped, or vertically misaligned.

- [ ] **Step 5: Run tests, lint, and build after binary replacement**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit with code 0.

- [ ] **Step 6: Commit the script and assets**

```bash
git add scripts/update-landing-screenshot-domain.mjs public/landing/01-hero-app.png public/landing/03-feature-place-share.png public/landing/04-feature-plan.png
git commit -m "fix: update landing screenshot domain"
```

---

### Task 6: Verify the Complete Landing Experience

**Files:**
- Verify: all files changed in Tasks 1–5.

**Interfaces:**
- Consumes: the production build and public landing route.
- Produces: evidence that the browser, server HTML, responsive layout, links, and raster assets satisfy the design specification.

- [ ] **Step 1: Run the complete automated verification suite**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit with code 0.

- [ ] **Step 2: Start the production build locally**

Run in a persistent terminal:

```bash
npm run start
```

Expected: Next.js serves the production build at `http://localhost:3000`.

- [ ] **Step 3: Verify server-visible content**

Run:

```bash
curl -sS http://localhost:3000 | rg "흩어진 여행 계획|김민형|박주영"
curl -sS http://localhost:3000 | rg "opacity:0|font-landing|howaboutus.app"
```

Expected: the first command finds the hero and team content. The second command returns no matches.

- [ ] **Step 4: Verify desktop rendering at 1440px**

Open `http://localhost:3000` at a 1440px-wide viewport and confirm:

- Header uses only the brand mark at upper left.
- Hero screenshot is approximately 1,080px wide and fully visible.
- Landscape screenshots retain full aspect ratio and their internal text is legible.
- Chat and AI screenshots are visually larger than the previous 240px presentation.
- Team cards have equal width and both GitHub links work.
- No horizontal overflow appears.

- [ ] **Step 5: Verify tablet and mobile rendering**

Repeat at 768px and 360px widths and confirm:

- Header anchor links hide while the login action remains.
- Body copy remains at least 16px.
- All feature sections and team cards stack into one column.
- Landscape screenshots remain uncropped.
- Portrait screenshots use the available width without overflowing.
- Focus indicators appear for brand, CTA, anchor, and GitHub links.

- [ ] **Step 6: Verify accessibility and navigation**

Using keyboard-only navigation, confirm:

- `우때 홈` is announced for the icon link.
- Heading order is one `h1`, section `h2`s, then card `h3`s.
- `기능`, `사용 방법`, and `팀` anchors land below the sticky header.
- Both GitHub links announce meaningful labels and open in a new tab.
- Reduced-motion preference does not hide or delay content.

- [ ] **Step 7: Review the final diff and repository state**

Run:

```bash
git diff --check
git status --short --branch
git log --oneline --decorate -6
```

Expected: no whitespace errors, no uncommitted product changes, and separate reviewable commits for contracts, sections, composition, and screenshot assets.
