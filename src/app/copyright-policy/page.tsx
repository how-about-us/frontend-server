import type { Metadata } from "next";

import { StaticPolicyDocumentView } from "@/components/agreements/StaticPolicyDocumentView";
import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";
import {
  COPYRIGHT_POLICY_EFFECTIVE_DATE,
  COPYRIGHT_POLICY_MARKDOWN,
} from "@/lib/agreements/static-policies/copyright-policy-content";
import { publicPageMetadata } from "@/lib/public-site-metadata";

export const metadata: Metadata = publicPageMetadata("/copyright-policy");

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
