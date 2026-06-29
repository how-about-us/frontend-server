import { MainSettingsPageLayout } from "@/components/layout/MainSettingsPageLayout";
import { MainPageHeader } from "@/components/layout/MainPageHeader";

import { MemberSettingsHostGuard } from "./_components/MemberSettingsHostGuard";
import { RoomMembersSection } from "./_components/RoomMembersSection";

export default function MemberSettingsPage() {
  return (
    <MainSettingsPageLayout>
      <div className="flex flex-col gap-2.5">
        <MainPageHeader title="멤버 관리" />
        <MemberSettingsHostGuard />
        <RoomMembersSection />
      </div>
    </MainSettingsPageLayout>
  );
}
