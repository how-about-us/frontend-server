import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { RoomMembersSection } from "./_components";

export default function SettingsPage() {
  return (
    <div className="rounded-2xl pl-6 pr-6">
      <SetSectionMaxWidth value="s1" />
      <RoomMembersSection />
    </div>
  );
}
