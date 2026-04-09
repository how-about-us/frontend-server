import { ScheduleCard } from "@/components/cards";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";

export default function PlanPage() {
  return (
    <div className="space-y-3">
      <SetSectionMaxWidth value="720px" />
      <ScheduleCard time="09:00" title="히코네성 산책" detail="도보 15분" />
      <ScheduleCard
        time="12:30"
        title="점심 - 오미규 덮밥"
        detail="예약 완료"
      />
      <ScheduleCard time="15:00" title="카페 휴식" detail="북마크한 장소" />
    </div>
  );
}
