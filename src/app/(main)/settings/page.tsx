import { redirect } from "next/navigation";

/** 레거시 `/settings` → `/member-settings` */
export default function LegacySettingsRedirectPage() {
  redirect("/member-settings");
}
