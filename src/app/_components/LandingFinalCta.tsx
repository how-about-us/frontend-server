import { LandingActionLink } from "@/app/_components/LandingActionLink";
import { LANDING_CONTAINER_CLASS, LANDING_SECTION_PY } from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";

export function LandingFinalCta() {
  return (
    <section className={`border-t border-gray-border bg-white ${LANDING_SECTION_PY}`}>
      <div className={`${LANDING_CONTAINER_CLASS} text-center`}>
        <h2 className={landingTypography.ctaTitle}>지금, 함께 여행을 계획해보세요.</h2>
        <p className={`${landingTypography.sectionBody} mx-auto mt-4 max-w-2xl`}>
          로그인하고 여행 방을 만들면 친구를 초대해 바로 계획을 시작할 수 있어요.
        </p>
        <LandingActionLink href="/login" className="mt-7 px-7 py-3">
          무료로 시작하기
        </LandingActionLink>
      </div>
    </section>
  );
}
