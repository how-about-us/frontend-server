import { LandingActionLink } from "@/app/_components/LandingActionLink";
import {
  LANDING_CONTAINER_CLASS,
  LANDING_SECTION_PY,
} from "@/lib/landing/landing-content";
import { landingTypography } from "@/lib/landing/landing-typography";

export function ProductTourFinalCta() {
  return (
    <section className={`border-t border-gray-border bg-white ${LANDING_SECTION_PY}`}>
      <div className={`${LANDING_CONTAINER_CLASS} text-center`}>
        <p className={landingTypography.eyebrow}>START PLANNING</p>
        <h2 className={`${landingTypography.ctaTitle} mt-3`}>
          Google 로그인 후 실제 서비스 시작
        </h2>
        <p className={`${landingTypography.sectionBody} mx-auto mt-4 max-w-2xl`}>
          여행 방을 만들고 친구를 초대해 함께 계획을 시작할 수 있습니다.
        </p>
        <LandingActionLink href="/login" className="mt-7 px-7 py-3">
          우때 시작하기
        </LandingActionLink>
      </div>
    </section>
  );
}
