import { Bookmark, CalendarDays, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LandingActionLink } from "@/app/_components/LandingActionLink";
import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  LANDING_FEATURE_SCREENSHOTS,
  LANDING_HERO_SCREENSHOT,
  type LandingFeatureScreenshotKey,
} from "@/lib/landing/landing-screenshots";

const FEATURES: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  description: string;
  screenshotKey: LandingFeatureScreenshotKey;
}> = [
  {
    icon: MessageCircle,
    title: "실시간 채팅 협업",
    description:
      "여행 멤버와 함께 장소를 공유하고, AI 추천까지 받으며 계획을 세워보세요.",
    screenshotKey: "chat",
  },
  {
    icon: Bookmark,
    title: "지도 기반 장소 탐색",
    description:
      "지도에서 장소를 찾고 북마크에 모아두세요. 함께 고른 장소를 한눈에 확인할 수 있어요.",
    screenshotKey: "map",
  },
  {
    icon: CalendarDays,
    title: "일정 계획",
    description:
      "날짜별로 일정을 구성하고, 이동 경로까지 확인하며 완성도 높은 여행을 준비하세요.",
    screenshotKey: "plan",
  },
];

export function LandingView() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-bubble-gray/80 via-white to-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(241,45,51,0.08),_transparent_55%)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-gray-border/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <BrandLogo alt="우때" />
          <LandingActionLink href="/login" className="px-5">
            로그인
          </LandingActionLink>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        <section className="mx-auto w-full max-w-5xl px-6 py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
              <BrandLogo alt="" style={{ width: 116, height: 66 }} />
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
                  함께 만드는 여행
                </h1>
                <p className="text-sm leading-relaxed text-dark-gray sm:text-base">
                  함께 만드는 여행 계획. 실시간으로 장소를 모으고 일정을
                  짜보세요.
                </p>
              </div>
              <LandingActionLink href="/login" className="px-8 py-3 text-base">
                지금 시작하기
              </LandingActionLink>
            </div>

            <LandingScreenshot
              screenshot={LANDING_HERO_SCREENSHOT}
              priority
              sizes="(max-width: 1024px) 100vw, 480px"
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 pb-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(
              ({ icon: Icon, title, description, screenshotKey }) => (
                <article
                  key={title}
                  className="overflow-hidden rounded-2xl border border-gray-border bg-white/95 shadow-sm"
                >
                  <LandingScreenshot
                    screenshot={LANDING_FEATURE_SCREENSHOTS[screenshotKey]}
                    frameClassName="rounded-none border-0 border-b border-gray-border shadow-none"
                    sizes="(max-width: 640px) 100vw, 320px"
                  />
                  <div className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </div>
                    <h2 className="mb-2 text-base font-semibold text-black">
                      {title}
                    </h2>
                    <p className="text-sm leading-relaxed text-dark-gray">
                      {description}
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
