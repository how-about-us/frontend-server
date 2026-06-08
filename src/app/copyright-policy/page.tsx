import type { Metadata } from "next";

import { StaticPolicyDocumentView } from "@/components/agreements/StaticPolicyDocumentView";
import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";
import {
  COPYRIGHT_POLICY_EFFECTIVE_DATE,
  COPYRIGHT_POLICY_MARKDOWN,
} from "@/lib/agreements/static-policies/copyright-policy-content";

export const metadata: Metadata = {
  title: "저작권 정책 — 우때",
  description: "우때 서비스 저작권 정책",
};

export default function CopyrightPolicyPage() {
  return (
    <PolicyPageShell title="저작권 정책">
      <StaticPolicyDocumentView
        title="저작권 정책"
        effectiveDate={COPYRIGHT_POLICY_EFFECTIVE_DATE}
        content={COPYRIGHT_POLICY_MARKDOWN}
      />
    </PolicyPageShell>
  );
}
