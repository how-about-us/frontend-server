import { Bookmark, CalendarDays, MessageCircle } from "lucide-react";

import { LandingActionLink } from "@/app/_components/LandingActionLink";
import { BrandLogo } from "@/components/BrandLogo";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "실시간 채팅 협업",
    description:
      "여행 멤버와 함께 장소를 공유하고, AI 추천까지 받으며 계획을 세워보세요.",
  },
  {
    icon: Bookmark,
    title: "지도 기반 장소 탐색",
    description:
      "지도에서 장소를 찾고 북마크에 모아두세요. 함께 고른 장소를 한눈에 확인할 수 있어요.",
  },
  {
    icon: CalendarDays,
    title: "일정 계획",
    description:
      "날짜별로 일정을 구성하고, 이동 경로까지 확인하며 완성도 높은 여행을 준비하세요.",
  },
] as const;

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
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex flex-col items-center gap-6">
            <BrandLogo alt="" style={{ width: 116, height: 66 }} />
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
                함께 만드는 여행
              </h1>
              <p className="text-sm leading-relaxed text-dark-gray">
                함께 만드는 여행 계획. 실시간으로 장소를 모으고 일정을 짜보세요.
              </p>
            </div>
            <LandingActionLink href="/login" className="px-8 py-3 text-base">
              지금 시작하기
            </LandingActionLink>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 pb-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-gray-border bg-white/95 p-6 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <h2 className="mb-2 text-base font-semibold text-black">
                  {title}
                </h2>
                <p className="text-sm leading-relaxed text-dark-gray">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
