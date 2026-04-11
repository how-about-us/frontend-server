import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { RoomMembersSection } from "./_components";

export default function SettingsPage() {
  return (
    <div className="rounded-2xl border border-gray-border bg-white p-4">
      <SetSectionMaxWidth value="s1" />
      <RoomMembersSection />
    </div>
  );
}
