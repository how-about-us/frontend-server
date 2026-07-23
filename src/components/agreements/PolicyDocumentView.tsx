import { connection } from "next/server";

import { findAgreementByType } from "@/lib/agreements/paths";
import type {
  AgreementType,
  CurrentAgreementsResponse,
} from "@/lib/agreements/types";
import { requiredEnv } from "@/lib/required-env";

import { AgreementMarkdownContent } from "./AgreementMarkdownContent";

const API_BASE = requiredEnv("API_BASE_URL");

type Props = {
  agreementType: AgreementType;
};

async function fetchCurrentAgreements(): Promise<CurrentAgreementsResponse> {
  const response = await fetch(`${API_BASE}/api/agreements/current`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("약관을 불러오지 못했습니다.");
  }

  return response.json() as Promise<CurrentAgreementsResponse>;
}

export async function PolicyDocumentView({ agreementType }: Props) {
  await connection();

  let agreement;
  try {
    const data = await fetchCurrentAgreements();
    agreement = findAgreementByType(data.items, agreementType);
  } catch (error) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-brand-red/35 bg-brand-red/[0.06] px-6 py-8 text-center shadow-[0_24px_80px_-12px_rgba(15,23,42,0.12)]">
        <p className="text-[17px] font-medium text-brand-red">
          문서를 불러오지 못했습니다
        </p>
        <p className="mt-2 text-[17px] text-muted-brown">
          {error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요."}
        </p>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-gray-border bg-white/95 px-6 py-10 text-center shadow-[0_24px_80px_-12px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <p className="text-[17px] text-dark-gray">
          현재 게시된 문서를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <article className="mx-auto w-full max-w-3xl rounded-3xl border border-gray-border bg-white/95 px-6 py-8 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:px-8 sm:py-10">
      <header className="border-b border-gray-border pb-6">
        <h2 className="text-[29px] font-bold text-neutral-900">{agreement.title}</h2>
        <p className="mt-2 text-[17px] text-dark-gray">버전 {agreement.version}</p>
      </header>

      <div className="pt-6">
        {agreement.contentFormat === "MARKDOWN" ? (
          <AgreementMarkdownContent
            content={agreement.content}
            variant="document"
          />
        ) : (
          <p className="whitespace-pre-wrap text-[19px] leading-relaxed text-dark-gray">
            {agreement.content}
          </p>
        )}
      </div>
    </article>
  );
}
