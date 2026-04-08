import { PlaceCard } from "@/components/cards";

export default function BookmarkPage() {
  return (
    <div className="space-y-3">
      <PlaceCard name="히코네성" tag="관광" />
      <PlaceCard name="유메쿄바시 캐슬로드" tag="거리" />
      <PlaceCard name="라 콜리나 오미하치만" tag="디저트" />
    </div>
  );
}
