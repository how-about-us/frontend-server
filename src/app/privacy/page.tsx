import type { Metadata } from "next";

import { PolicyDocumentView } from "@/components/agreements/PolicyDocumentView";
import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — 우때",
  description: "우때 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <PolicyPageShell title="개인정보 처리방침">
      <PolicyDocumentView agreementType="PRIVACY_POLICY" />
    </PolicyPageShell>
  );
}
