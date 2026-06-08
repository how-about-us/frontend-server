import type { Metadata } from "next";

import { PolicyDocumentView } from "@/components/agreements/PolicyDocumentView";
import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";

export const metadata: Metadata = {
  title: "이용약관 — 우때",
  description: "우때 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <PolicyPageShell title="이용약관">
      <PolicyDocumentView agreementType="TERMS_OF_SERVICE" />
    </PolicyPageShell>
  );
}
