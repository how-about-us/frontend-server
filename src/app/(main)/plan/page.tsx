import { PlanChatSectionWidth, PlanDaySection, PlanItinerary } from "@/components/plan";
import { MOCK_PLAN_DAYS } from "@/mocks";

export default function PlanPage() {
  return (
    <div className="space-y-3">
      <PlanChatSectionWidth />
      {MOCK_PLAN_DAYS.map((day) => (
        <PlanDaySection
          key={day.id}
          title={day.dayLabel}
          subtitle={day.dateLabel}
        >
          <PlanItinerary initialPlaces={day.places} />
        </PlanDaySection>
      ))}
    </div>
  );
}
