import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { LandingReveal } from "@/app/_components/LandingReveal";
import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import type {
  LandingHighlightSection,
  LandingSplitSection,
} from "@/lib/landing/landing-content";
import { LANDING_FEATURE_SCREENSHOT_SIZES } from "@/lib/landing/landing-content";
import {
  LANDING_FEATURE_SCREENSHOTS,
  LANDING_FRAMED_SCREENSHOT_SIZES,
  LANDING_HERO_SCREENSHOT_SIZES,
  type LandingScreenshotSpec,
} from "@/lib/landing/landing-screenshots";
import { landingTypography } from "@/lib/landing/landing-typography";
import { cn } from "@/lib/utils";

export function LandingSectionIntro({
  id,
  title,
  subtitle,
  className,
}: {
  id?: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <h2 id={id} className={landingTypography.sectionTitle}>
        {title}
      </h2>
      <p className={cn("mt-3", landingTypography.sectionSubtitle)}>{subtitle}</p>
    </div>
  );
}

export function LandingBulletList({
  items,
  nowrap = false,
}: {
  items: readonly string[];
  nowrap?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((point) => (
        <li
          key={point}
          className={cn(
            "flex items-start gap-2.5",
            landingTypography.chipBody,
            nowrap && "landing-sm:whitespace-nowrap",
          )}
        >
          <span
            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red"
            aria-hidden
          />
          {point}
        </li>
      ))}
    </ul>
  );
}

export function LandingIconChip({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-lg border border-gray-border bg-white/95 p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>
      <h3 className={landingTypography.chipTitle}>{title}</h3>
      <p className={landingTypography.chipBody}>{description}</p>
    </article>
  );
}

export function LandingStepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-lg border border-gray-border bg-white/95 p-6 shadow-sm">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-brand-red",
          landingTypography.stepBadge,
        )}
      >
        {step}
      </span>
      <h3 className={landingTypography.stepTitle}>{title}</h3>
      <p className={landingTypography.stepBody}>{description}</p>
    </article>
  );
}

type LandingSectionCopy = Pick<
  LandingSplitSection,
  "id" | "title" | "description" | "points" | "eyebrow"
>;

function LandingSplitCopy({ section }: { section: LandingSectionCopy }) {
  return (
    <div className="flex flex-col gap-5">
      {section.eyebrow ? (
        <p className={landingTypography.splitEyebrow}>{section.eyebrow}</p>
      ) : null}
      <h2 id={`landing-${section.id}-heading`} className={landingTypography.sectionTitle}>
        {section.title}
      </h2>
      <p className={cn(landingTypography.sectionSubtitle, "whitespace-pre-line")}>
        {section.description}
      </p>
      <LandingBulletList items={section.points} />
    </div>
  );
}

function LandingHighlightHeader({ section }: { section: LandingSectionCopy }) {
  return (
    <div className="flex flex-col gap-4 text-center landing-sm:text-left">
      <div className="flex flex-col items-center gap-1 landing-sm:flex-row landing-sm:flex-wrap landing-sm:items-end landing-sm:justify-start landing-sm:gap-x-6">
        <h2
          id={`landing-${section.id}-heading`}
          className={landingTypography.sectionTitle}
        >
          {section.title}
        </h2>
        {section.eyebrow ? (
          <p className={cn(landingTypography.splitEyebrow, "pb-1")}>
            {section.eyebrow}
          </p>
        ) : null}
      </div>
      <p className={cn(landingTypography.sectionSubtitle, "whitespace-pre-line")}>
        {section.description}
      </p>
    </div>
  );
}

export function LandingSplitSectionBlock({
  section,
  sectionClassName,
}: {
  section: LandingSplitSection;
  sectionClassName?: string;
}) {
  const screenshot: LandingScreenshotSpec =
    LANDING_FEATURE_SCREENSHOTS[section.screenshotKey];
  const textVariant = section.reverse ? "slide-right" : "slide-left";
  const imageVariant = section.reverse ? "slide-left" : "slide-right";

  return (
    <section
      className={cn(
        "border-t border-gray-border/40",
        section.background === "muted" ? "bg-bubble-gray/40" : "bg-white",
        sectionClassName,
      )}
      aria-labelledby={`landing-${section.id}-heading`}
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 landing-lg:grid-cols-2 landing-lg:gap-16">
        <LandingReveal
          variant={textVariant}
          className={cn(
            "flex flex-col gap-5",
            section.reverse ? "landing-lg:order-2" : "landing-lg:order-1",
          )}
        >
          <LandingSplitCopy section={section} />
        </LandingReveal>

        <LandingReveal
          variant={imageVariant}
          delay={0.12}
          className={cn(section.reverse ? "landing-lg:order-1" : "landing-lg:order-2")}
        >
          <LandingScreenshot
            screenshot={screenshot}
            sizes={
              screenshot.framed
                ? LANDING_FRAMED_SCREENSHOT_SIZES
                : LANDING_FEATURE_SCREENSHOT_SIZES
            }
          />
        </LandingReveal>
      </div>
    </section>
  );
}

function LandingHighlightColumn({ section }: { section: LandingHighlightSection }) {
  const screenshot: LandingScreenshotSpec =
    LANDING_FEATURE_SCREENSHOTS[section.screenshotKey];

  return (
    <article
      className="flex min-w-0 flex-col gap-6 landing-lg:min-w-[22rem]"
      aria-labelledby={`landing-${section.id}-heading`}
    >
      <LandingReveal variant="slide-up">
        <LandingHighlightHeader section={section} />
      </LandingReveal>

      <div className="flex w-full flex-col items-center gap-5 landing-sm:flex-row landing-sm:items-start landing-sm:justify-start landing-sm:gap-6">
        <LandingReveal variant="scale" delay={0.1} className="shrink-0">
          <LandingScreenshot
            screenshot={screenshot}
            sizes={LANDING_FRAMED_SCREENSHOT_SIZES}
          />
        </LandingReveal>

        <LandingReveal
          variant="slide-up"
          delay={0.18}
          className="min-w-0 flex-1 landing-sm:pt-1"
        >
          <LandingBulletList items={section.points} nowrap />
        </LandingReveal>
      </div>
    </article>
  );
}

export function LandingHighlightSectionsRow({
  sections,
  sectionClassName,
}: {
  sections: readonly LandingHighlightSection[];
  sectionClassName?: string;
}) {
  return (
    <section
      className={cn(
        "border-t border-gray-border/40 bg-bubble-gray/40",
        sectionClassName,
      )}
      aria-label="채팅과 AI"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 landing-lg:grid-cols-2 landing-lg:items-start landing-lg:gap-x-16 landing-lg:gap-y-12">
        {sections.map((section) => (
          <LandingHighlightColumn key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}

export function LandingHeroScreenshot({
  screenshot,
}: {
  screenshot: LandingScreenshotSpec;
}) {
  return (
    <LandingReveal
      variant="slide-right"
      delay={0.15}
      immediate
      className="w-full landing-lg:min-w-0"
    >
      <LandingScreenshot
        screenshot={screenshot}
        priority
        sizes={LANDING_HERO_SCREENSHOT_SIZES}
      />
    </LandingReveal>
  );
}

export function LandingProblemBanner({ children }: { children: ReactNode }) {
  return (
    <section
      className="border-y border-gray-border/60 bg-brand-red/[0.04] py-8"
      aria-label="문제와 해결"
    >
      <LandingReveal variant="scale">
        <div className="mx-auto flex max-w-3xl flex-col gap-1.5 px-6">
          {children}
        </div>
      </LandingReveal>
    </section>
  );
}
