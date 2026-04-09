import { PlaceAutocomplete } from "@/components/googleMap";
import { SearchResultCard } from "@/components/SearchResultCard";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { MOCK_SEARCH_RESULTS } from "@/mocks";

export default function SearchPage() {
  return (
    <div className="-m-6 flex h-full min-h-0 flex-col">
      <SetSectionMaxWidth value="400px" />
      <div className="flex h-11 shrink-0 items-center border-b border-gray-border">
        <PlaceAutocomplete />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {MOCK_SEARCH_RESULTS.map((result, i) => (
          <SearchResultCard key={i} {...result} />
        ))}
      </div>
    </div>
  );
}
