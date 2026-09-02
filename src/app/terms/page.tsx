import type { Metadata } from "next";

import { PolicyDocumentView } from "@/components/agreements/PolicyDocumentView";
import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";
import { publicPageMetadata } from "@/lib/public-site-metadata";

export const metadata: Metadata = publicPageMetadata("/terms");

export default function TermsPage() {
  return (
    <PolicyPageShell title="이용약관">
      <PolicyDocumentView agreementType="TERMS_OF_SERVICE" />
    </PolicyPageShell>
  );
}
