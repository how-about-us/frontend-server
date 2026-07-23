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
