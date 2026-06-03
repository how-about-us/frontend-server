import { LandingActionLink } from "@/app/_components/LandingActionLink";
import {
  LandingHeroScreenshot,
  LandingIconChip,
  LandingProblemBanner,
  LandingSectionIntro,
  LandingSplitSectionBlock,
  LandingStepCard,
} from "@/app/_components/LandingSections";
import {
  LANDING_CHIP_REVEAL_VARIANTS,
  LandingReveal,
  LandingRevealItem,
  LandingRevealStagger,
} from "@/app/_components/LandingReveal";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  LANDING_FEATURE_CHIPS,
  LANDING_ONBOARDING_STEPS,
  LANDING_SECTION_PY,
  LANDING_SPLIT_SECTIONS,
} from "@/lib/landing/landing-content";
import { LANDING_FONT_VARIABLE } from "@/lib/landing/landing-font";
import { landingTypography } from "@/lib/landing/landing-typography";
import { LANDING_HERO_SCREENSHOT } from "@/lib/landing/landing-screenshots";
import { cn } from "@/lib/utils";

export function LandingView() {
  return (
    <div
      className={cn(
        LANDING_FONT_VARIABLE,
        "relative flex min-h-screen flex-col bg-gradient-to-b from-bubble-gray/80 via-white to-white",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(241,45,51,0.08),_transparent_55%)]"
        aria-hidden
      />

      <header className="sticky top-0 z-20 border-b border-gray-border/60 bg-white/80 font-sans backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <BrandLogo alt="우때" />
          <LandingActionLink href="/login" className="px-5">
            로그인
          </LandingActionLink>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col font-sans antialiased">
        <section className={`mx-auto w-full max-w-5xl px-6 ${LANDING_SECTION_PY}`}>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <LandingReveal
              immediate
              variant="slide-left"
              className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left"
            >
              <BrandLogo alt="" style={{ width: 116, height: 66 }} />
              <div className="flex flex-col gap-3">
                <h1 className={landingTypography.heroTitle}>함께 만드는 여행</h1>
                <p className={landingTypography.heroBody}>
                  실시간으로 장소를 모으고, 일정을 짜고, AI와 함께 완성도 높은
                  여행을 준비하세요.
                </p>
              </div>
              <LandingActionLink
                href="/login"
                className={cn("px-8 py-3", landingTypography.primaryAction)}
              >
                지금 시작하기
              </LandingActionLink>
            </LandingReveal>

            <LandingHeroScreenshot screenshot={LANDING_HERO_SCREENSHOT} />
          </div>
        </section>

        <LandingProblemBanner>
          단톡방, 지도 앱, 메모장을 오가지 마세요 —{" "}
          <span className="text-brand-red">한 화면에서 동시에.</span>
        </LandingProblemBanner>

        <section
          className={`mx-auto w-full max-w-5xl px-6 ${LANDING_SECTION_PY}`}
          aria-labelledby="landing-features-heading"
        >
          <LandingReveal variant="fade" className="mb-10">
            <LandingSectionIntro
              id="landing-features-heading"
              title="여행 계획에 필요한 모든 것"
              subtitle="채팅, 지도, 일정, AI까지 — 팀과 함께 쓰는 여행 플래너"
            />
          </LandingReveal>

          <LandingRevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_FEATURE_CHIPS.map((chip, index) => (
              <LandingRevealItem
                key={chip.title}
                variant={LANDING_CHIP_REVEAL_VARIANTS[index]}
              >
                <LandingIconChip {...chip} />
              </LandingRevealItem>
            ))}
          </LandingRevealStagger>
        </section>

        {LANDING_SPLIT_SECTIONS.map((section) => (
          <LandingSplitSectionBlock
            key={section.id}
            section={section}
            sectionClassName={LANDING_SECTION_PY}
          />
        ))}

        <section
          className={`border-t border-gray-border/40 bg-bubble-gray/40 ${LANDING_SECTION_PY}`}
          aria-labelledby="landing-how-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <LandingReveal variant="slide-down" className="mb-10">
              <LandingSectionIntro
                id="landing-how-heading"
                title="시작 방법"
                subtitle="3단계면 팀 여행 계획을 시작할 수 있어요"
              />
            </LandingReveal>

            <LandingRevealStagger stagger={0.14} className="grid gap-4 sm:grid-cols-3">
              {LANDING_ONBOARDING_STEPS.map((step) => (
                <LandingRevealItem key={step.step} variant="scale">
                  <LandingStepCard {...step} />
                </LandingRevealItem>
              ))}
            </LandingRevealStagger>
          </div>
        </section>

        <section className={`border-t border-gray-border/40 ${LANDING_SECTION_PY}`}>
          <LandingReveal
            variant="scale"
            className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center"
          >
            <h2 className={landingTypography.ctaTitle}>
              지금 바로 함께 여행을 만들어보세요
            </h2>
            <p className={landingTypography.ctaBody}>
              로그인하고 여행 방을 만들면, 친구를 초대해 바로 계획을 시작할 수
              있어요.
            </p>
            <LandingActionLink
              href="/login"
              className={cn("px-8 py-3", landingTypography.primaryAction)}
            >
              지금 시작하기
            </LandingActionLink>
          </LandingReveal>
        </section>
      </main>

      <SiteFooter className="font-sans" />
    </div>
  );
}
