import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { RoomMembersSection } from "@/components/settings";

export default function SettingsPage() {
  return (
    <div className="rounded-2xl border border-gray-border bg-white p-4">
      <SetSectionMaxWidth value="s1" />
      <RoomMembersSection />
    </div>
  );
}
