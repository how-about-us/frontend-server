import { MainSettingsPageLayout } from "@/components/layout/MainSettingsPageLayout";

import { MemberSettingsHostGuard } from "./_components/MemberSettingsHostGuard";
import { RoomMembersSection } from "./_components/RoomMembersSection";

export default function MemberSettingsPage() {
  return (
    <MainSettingsPageLayout>
      <MemberSettingsHostGuard />
      <RoomMembersSection />
    </MainSettingsPageLayout>
  );
}
