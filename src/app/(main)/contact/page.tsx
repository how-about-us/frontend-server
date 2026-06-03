import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { CopyableSupportEmail } from "@/components/contact/CopyableSupportEmail";
import { MainSettingsPageLayout } from "@/components/layout/MainSettingsPageLayout";
import { FEEDBACK_FORM_URL } from "@/components/layout/sidebarFeedbackForm";

export default function ContactPage() {
  return (
    <MainSettingsPageLayout>
      <div className="flex min-w-0 w-full flex-col gap-4">
        <div>
          <h1 className="text-lg font-bold text-black">문의하기</h1>
          <p className="mt-1 text-xs leading-relaxed text-dark-gray">
            버그 신고, 기능 제안, 계정 관련 문의 등 편하게 연락해 주세요.
          </p>
        </div>

        <CopyableSupportEmail variant="card" />

        <p className="text-xs leading-relaxed text-dark-gray">
          이메일을 클릭하면 주소가 복사됩니다.
        </p>

        <Link
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-red transition hover:opacity-80"
        >
          피드백 설문 보내기
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </MainSettingsPageLayout>
  );
}
