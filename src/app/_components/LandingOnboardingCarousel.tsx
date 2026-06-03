"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { LandingStepCard } from "@/app/_components/LandingSections";
import { LANDING_ONBOARDING_STEPS } from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";
import { cn } from "@/lib/utils";

const slideTransition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1] as const,
};

const cardVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 32 : -32,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -32 : 32,
  }),
};

export function LandingOnboardingCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const reduceMotion = useReducedMotion();

  const activeStep = LANDING_ONBOARDING_STEPS[activeIndex];

  function goToStep(index: number) {
    if (index === activeIndex) return;
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
      <div
        role="tablist"
        aria-label="시작 방법 단계"
        className="flex gap-2"
      >
        {LANDING_ONBOARDING_STEPS.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.step}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="landing-onboarding-panel"
              id={`landing-onboarding-tab-${item.step}`}
              onClick={() => goToStep(index)}
              className={cn(
                "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition",
                landingTypography.stepBadge,
                isActive
                  ? "bg-brand-red text-white shadow-sm"
                  : "border border-gray-border bg-white text-dark-gray hover:border-brand-red/35 hover:text-brand-red",
              )}
            >
              {item.step}
            </button>
          );
        })}
      </div>

      <div
        id="landing-onboarding-panel"
        role="tabpanel"
        aria-labelledby={`landing-onboarding-tab-${activeStep.step}`}
        className="relative w-full min-h-[10.5rem]"
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={reduceMotion ? undefined : cardVariants}
            initial={reduceMotion ? false : "enter"}
            animate={reduceMotion ? undefined : "center"}
            exit={reduceMotion ? undefined : "exit"}
            transition={reduceMotion ? { duration: 0 } : slideTransition}
            className="w-full"
          >
            <LandingStepCard {...activeStep} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
