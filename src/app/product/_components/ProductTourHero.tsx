import { LandingScreenshot } from "@/app/_components/LandingScreenshot";
import { LANDING_CONTAINER_CLASS } from "@/lib/landing/landing-content";
import {
  LANDING_HERO_SCREENSHOT,
  LANDING_HERO_SCREENSHOT_SIZES,
} from "@/lib/landing/landing-screenshots";
import { landingTypography } from "@/lib/landing/landing-typography";
import { PRODUCT_TOUR_FLOW } from "@/lib/product/product-tour-content";

export function ProductTourHero() {
  return (
    <section className="bg-[radial-gradient(circle_at_50%_12%,rgba(241,45,51,0.11),transparent_35%)] pt-16 pb-12 landing-lg:pt-24 landing-lg:pb-16">
      <div className={`${LANDING_CONTAINER_CLASS} text-center`}>
        <p className={landingTypography.eyebrow}>LIVE PRODUCT TOUR</p>
        <h1 className={`${landingTypography.heroTitle} mx-auto mt-4 max-w-4xl`}>
          실제 화면으로 보는 우때
        </h1>
        <p className={`${landingTypography.heroBody} mx-auto mt-5 max-w-3xl`}>
          현재 운영 중인 우때에서 장소를 찾고, 대화하고, 일정과 이동 동선을
          완성하는 전체 흐름을 확인하세요.
        </p>
        <div className="mx-auto mt-10 max-w-[1080px] overflow-hidden rounded-2xl border border-gray-border bg-white p-2 shadow-[0_24px_70px_-28px_rgba(71,31,33,0.28)] landing-sm:p-3">
          <p className="px-3 pt-2 pb-3 text-left text-sm font-semibold text-dark-gray">
            현재 운영 중인 우때 서비스의 실제 화면
          </p>
          <LandingScreenshot
            screenshot={LANDING_HERO_SCREENSHOT}
            priority
            sizes={LANDING_HERO_SCREENSHOT_SIZES}
            className="rounded-xl"
          />
        </div>
        <ol className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-2">
          {PRODUCT_TOUR_FLOW.map((step, index) => (
            <li
              key={step}
              className="rounded-full border border-gray-border bg-white px-4 py-2 text-sm font-bold text-neutral-900"
            >
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
