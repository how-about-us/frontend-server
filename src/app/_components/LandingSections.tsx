import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { LandingReveal } from "@/app/_components/LandingReveal";
import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import type { LandingSplitSection } from "@/lib/landing/landing-content";
import { LANDING_FEATURE_SCREENSHOT_SIZES } from "@/lib/landing/landing-content";
import {
  LANDING_FEATURE_SCREENSHOTS,
  type LandingScreenshotSpec,
} from "@/lib/landing/landing-screenshots";
import { cn } from "@/lib/utils";

const headingClassName =
  "text-2xl font-bold tracking-tight text-black sm:text-3xl";
const bodyClassName = "text-sm leading-relaxed text-dark-gray sm:text-base";

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
      <h2 id={id} className={headingClassName}>
        {title}
      </h2>
      <p className={cn("mt-3", bodyClassName)}>{subtitle}</p>
    </div>
  );
}

export function LandingBulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((point) => (
        <li
          key={point}
          className={cn("flex items-start gap-2.5", bodyClassName)}
        >
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red"
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
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-gray-border bg-white/95 p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-black">{title}</h3>
      <p className={bodyClassName}>{description}</p>
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
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-gray-border bg-white/95 p-6 shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
        {step}
      </span>
      <h3 className="text-base font-semibold text-black">{title}</h3>
      <p className={bodyClassName}>{description}</p>
    </article>
  );
}

function LandingSplitCopy({
  section,
}: {
  section: Pick<
    LandingSplitSection,
    "id" | "title" | "description" | "points" | "eyebrow"
  >;
}) {
  return (
    <>
      {section.eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">
          {section.eyebrow}
        </p>
      ) : null}
      <h2 id={`landing-${section.id}-heading`} className={headingClassName}>
        {section.title}
      </h2>
      <p className={bodyClassName}>{section.description}</p>
      <LandingBulletList items={section.points} />
    </>
  );
}

export function LandingSplitSectionBlock({
  section,
  sectionClassName,
}: {
  section: LandingSplitSection;
  sectionClassName?: string;
}) {
  const screenshot = LANDING_FEATURE_SCREENSHOTS[section.screenshotKey];
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
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <LandingReveal
          variant={textVariant}
          className={cn(
            "flex flex-col gap-5",
            section.reverse ? "lg:order-2" : "lg:order-1",
          )}
        >
          <LandingSplitCopy section={section} />
        </LandingReveal>

        <LandingReveal
          variant={imageVariant}
          delay={0.12}
          className={cn(section.reverse ? "lg:order-1" : "lg:order-2")}
        >
          <LandingScreenshot
            screenshot={screenshot}
            sizes={LANDING_FEATURE_SCREENSHOT_SIZES}
          />
        </LandingReveal>
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
    <LandingReveal variant="slide-right" delay={0.15} immediate>
      <LandingScreenshot
        screenshot={screenshot}
        priority
        sizes={LANDING_FEATURE_SCREENSHOT_SIZES}
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
        <p className="mx-auto max-w-3xl px-6 text-center text-base font-medium leading-relaxed text-black sm:text-lg">
          {children}
        </p>
      </LandingReveal>
    </section>
  );
}
