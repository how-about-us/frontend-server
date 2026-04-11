import { PlaceCard } from "@/components/cards";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { MOCK_BOOKMARKS } from "@/mocks";

export default function BookmarkPage() {
  return (
    <div className="space-y-3">
      <SetSectionMaxWidth value="s1" />
      {MOCK_BOOKMARKS.map((item) => (
        <PlaceCard key={item.name} {...item} />
      ))}
    </div>
  );
}
