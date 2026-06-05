/** 강조(제목·CTA) — BMJUA, 그 외 — Inter (`font-sans`) */

const emphasis = "font-landing font-normal";
const bodyMd =
  "font-sans font-medium text-sm leading-[1.65] text-dark-gray landing-sm:text-base landing-sm:leading-relaxed";
const bodySm =
  "font-sans font-medium text-xs leading-[1.65] text-dark-gray landing-sm:text-sm";

export const landingTypography = {
  heroTitle: `${emphasis} text-[2rem] leading-[1.12] text-black landing-sm:text-[2.75rem] landing-lg:text-[3.25rem]`,
  heroBody: `${bodyMd} max-w-md`,
  bannerHighlight: `${emphasis} text-center text-2xl leading-[1.2] text-brand-red landing-sm:text-3xl landing-sm:leading-tight`,
  bannerLead: `${emphasis} text-center text-lg leading-[1.55] text-black landing-sm:text-xl landing-sm:leading-relaxed`,
  sectionTitle: `${emphasis} text-[1.75rem] leading-[1.15] text-black landing-sm:text-4xl landing-sm:leading-tight`,
  sectionSubtitle: bodyMd,
  chipTitle: `${emphasis} text-lg leading-snug text-black`,
  chipBody: bodySm,
  splitEyebrow: `${emphasis} text-sm uppercase tracking-wide text-brand-red`,
  stepBadge: `${emphasis} text-base text-white`,
  stepTitle: `${emphasis} text-lg leading-snug text-black`,
  stepBody: bodySm,
  ctaTitle: `${emphasis} text-[1.75rem] leading-[1.15] text-black landing-sm:text-4xl landing-sm:leading-tight`,
  ctaBody: bodyMd,
  primaryAction: `${emphasis} text-lg`,
} as const;
