import type { Metadata } from "next";

import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";
import { AnalyticsConsentSettings } from "@/components/analytics/AnalyticsConsentSettings";

export const metadata: Metadata = {
  title: "개인정보 설정 — 우때",
  description: "우때 분석 쿠키 허용 및 철회 설정",
};

export default function PrivacySettingsPage() {
  return (
    <PolicyPageShell title="개인정보 설정">
      <AnalyticsConsentSettings />
    </PolicyPageShell>
  );
}
