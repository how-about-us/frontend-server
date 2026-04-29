import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { RoomMembersSection } from "./_components";
import { SettingsHostGuard } from "./_components/SettingsHostGuard";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 rounded-2xl pl-6 pr-6 pb-10">
      <SetSectionMaxWidth value="s1" />
      <SettingsHostGuard />
      <RoomMembersSection />
    </div>
  );
}
