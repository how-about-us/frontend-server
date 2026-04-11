import { ScheduleCard } from "@/components/cards";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { MOCK_SCHEDULE_ITEMS } from "@/mocks";

export default function PlanPage() {
  return (
    <div className="space-y-3">
      <SetSectionMaxWidth value="s2" />
      {MOCK_SCHEDULE_ITEMS.map((item) => (
        <ScheduleCard key={item.time} {...item} />
      ))}
    </div>
  );
}
