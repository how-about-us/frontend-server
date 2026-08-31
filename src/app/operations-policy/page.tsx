import type { Metadata } from "next";

import { StaticPolicyDocumentView } from "@/components/agreements/StaticPolicyDocumentView";
import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";
import {
  OPERATIONS_POLICY_EFFECTIVE_DATE,
  OPERATIONS_POLICY_MARKDOWN,
} from "@/lib/agreements/static-policies/operations-policy-content";
import { publicPageMetadata } from "@/lib/public-site-metadata";

export const metadata: Metadata = publicPageMetadata("/operations-policy");

export default function OperationsPolicyPage() {
  return (
    <PolicyPageShell title="운영정책">
      <StaticPolicyDocumentView
        title="운영정책"
        effectiveDate={OPERATIONS_POLICY_EFFECTIVE_DATE}
        content={OPERATIONS_POLICY_MARKDOWN}
      />
    </PolicyPageShell>
  );
}
