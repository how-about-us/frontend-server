import type { Metadata } from "next";

import { PolicyDocumentView } from "@/components/agreements/PolicyDocumentView";
import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";
import { publicPageMetadata } from "@/lib/public-site-metadata";

export const metadata: Metadata = publicPageMetadata("/privacy");

export default function PrivacyPage() {
  return (
    <PolicyPageShell title="개인정보 처리방침">
      <PolicyDocumentView agreementType="PRIVACY_POLICY" />
    </PolicyPageShell>
  );
}
