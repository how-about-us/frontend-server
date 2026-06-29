import { MainSettingsPageLayout } from "@/components/layout/MainSettingsPageLayout";

import { RoomMembersSection } from "./_components/RoomMembersSection";

export default function MemberSettingsPage() {
  return (
    <MainSettingsPageLayout>
      <RoomMembersSection />
    </MainSettingsPageLayout>
  );
}
