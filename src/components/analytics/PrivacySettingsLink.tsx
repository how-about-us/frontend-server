import type { ComponentProps } from "react";
import Link from "next/link";

import { ANALYTICS_CONSENT_SETTINGS_PATH } from "@/lib/analytics/paths";

type PrivacySettingsLinkProps = Omit<ComponentProps<typeof Link>, "href">;

export function PrivacySettingsLink(props: PrivacySettingsLinkProps) {
  return <Link href={ANALYTICS_CONSENT_SETTINGS_PATH} {...props} />;
}
