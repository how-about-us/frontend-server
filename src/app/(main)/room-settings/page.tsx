import { MainSettingsPageLayout } from "@/components/layout/MainSettingsPageLayout";

import { RoomTripSettingsSection } from "./_components/RoomTripSettingsSection";

export default function RoomSettingsPage() {
  return (
    <MainSettingsPageLayout>
      <RoomTripSettingsSection />
    </MainSettingsPageLayout>
  );
}
