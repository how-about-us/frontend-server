"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type LandingRevealVariant =
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "fade"
  | "scale";

const SLIDE_OFFSET = 36;

const baseTransition: Transition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const scaleTransition: Transition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1],
};

function getHiddenState(variant: LandingRevealVariant) {
  switch (variant) {
    case "slide-up":
      return { opacity: 0, y: SLIDE_OFFSET };
    case "slide-down":
      return { opacity: 0, y: -SLIDE_OFFSET };
    case "slide-left":
      return { opacity: 0, x: -SLIDE_OFFSET };
    case "slide-right":
      return { opacity: 0, x: SLIDE_OFFSET };
    case "fade":
      return { opacity: 0 };
    case "scale":
      return { opacity: 0, scale: 0.92 };
  }
}

function getVisibleState(variant: LandingRevealVariant) {
  switch (variant) {
    case "slide-up":
    case "slide-down":
      return { opacity: 1, y: 0 };
    case "slide-left":
    case "slide-right":
      return { opacity: 1, x: 0 };
    case "fade":
      return { opacity: 1 };
    case "scale":
      return { opacity: 1, scale: 1 };
  }
}

function getTransition(variant: LandingRevealVariant, delay = 0): Transition {
  const transition = variant === "scale" ? scaleTransition : baseTransition;
  return delay > 0 ? { ...transition, delay } : transition;
}

function StaticOrMotion({
  reduceMotion,
  className,
  children,
  motionProps,
}: {
  reduceMotion: boolean | null;
  className?: string;
  children: ReactNode;
  motionProps: ComponentProps<typeof motion.div>;
}) {
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  );
}

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  variant?: LandingRevealVariant;
  delay?: number;
  /** Hero 등 첫 화면 — 마운트 시 바로 등장 */
  immediate?: boolean;
};

export function LandingReveal({
  children,
  className,
  variant = "slide-up",
  delay = 0,
  immediate = false,
}: LandingRevealProps) {
  const reduceMotion = useReducedMotion();
  const hidden = getHiddenState(variant);
  const visible = getVisibleState(variant);
  const transition = getTransition(variant, delay);

  const motionProps = immediate
    ? { initial: hidden, animate: visible, transition }
    : {
        initial: hidden,
        whileInView: visible,
        viewport: { once: true, margin: "-48px" },
        transition,
      };

  return (
    <StaticOrMotion
      reduceMotion={reduceMotion}
      className={className}
      motionProps={motionProps}
    >
      {children}
    </StaticOrMotion>
  );
}

type LandingRevealStaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

export function LandingRevealStagger({
  children,
  className,
  stagger = 0.09,
}: LandingRevealStaggerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <StaticOrMotion
      reduceMotion={reduceMotion}
      className={className}
      motionProps={{
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, margin: "-40px" },
        variants: {
          hidden: {},
          visible: { transition: { staggerChildren: stagger } },
        },
      }}
    >
      {children}
    </StaticOrMotion>
  );
}

type LandingRevealItemProps = {
  children: ReactNode;
  className?: string;
  variant?: LandingRevealVariant;
};

export function LandingRevealItem({
  children,
  className,
  variant = "slide-up",
}: LandingRevealItemProps) {
  const reduceMotion = useReducedMotion();
  const hidden = getHiddenState(variant);
  const visible = getVisibleState(variant);
  const transition = getTransition(variant);

  return (
    <StaticOrMotion
      reduceMotion={reduceMotion}
      className={cn(className)}
      motionProps={{
        variants: {
          hidden,
          visible: { ...visible, transition },
        },
      }}
    >
      {children}
    </StaticOrMotion>
  );
}

/** 그리드 칩 등 — 인덱스에 따라 방향을 번갈아 적용 */
export const LANDING_CHIP_REVEAL_VARIANTS: readonly LandingRevealVariant[] = [
  "slide-up",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-left",
  "slide-right",
];
