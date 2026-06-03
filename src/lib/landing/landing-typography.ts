/** 볼드 — 런드리고딕, 그 외 — Inter (`font-sans`) */

const bold = "font-landing font-bold";
const body = "font-sans font-normal";

export const landingTypography = {
  heroTitle: `${bold} text-[2.125rem] leading-[1.12] text-black sm:text-5xl lg:text-[3.5rem]`,
  heroBody: `${body} max-w-md text-base leading-[1.65] text-dark-gray sm:text-lg sm:leading-relaxed`,
  banner: `${bold} text-center text-lg leading-[1.55] text-black sm:text-xl sm:leading-relaxed`,
  sectionTitle: `${bold} text-[1.75rem] leading-[1.15] text-black sm:text-4xl sm:leading-tight`,
  sectionSubtitle: `${body} text-base leading-[1.65] text-dark-gray sm:text-lg sm:leading-relaxed`,
  chipTitle: `${bold} text-lg leading-snug text-black`,
  chipBody: `${body} text-sm leading-[1.65] text-dark-gray sm:text-base`,
  splitEyebrow: `${bold} text-sm uppercase tracking-wide text-brand-red`,
  stepBadge: `${bold} text-base text-white`,
  stepTitle: `${bold} text-lg leading-snug text-black`,
  stepBody: `${body} text-sm leading-[1.65] text-dark-gray sm:text-base`,
  ctaTitle: `${bold} text-[1.75rem] leading-[1.15] text-black sm:text-4xl sm:leading-tight`,
  ctaBody: `${body} text-base leading-[1.65] text-dark-gray sm:leading-relaxed`,
  primaryAction: `${bold} text-lg`,
} as const;
