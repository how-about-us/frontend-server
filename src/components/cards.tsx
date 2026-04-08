export function ScheduleCard({
  time,
  title,
  detail,
}: {
  time: string;
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-md bg-[#e5e7eb] px-2 py-1 text-xs font-semibold text-dark-gray">
          {time}
        </span>
        <span className="text-xs text-brand-green">{detail}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
    </article>
  );
}

export function PlaceCard({ name, tag }: { name: string; tag: string }) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <h3 className="text-sm font-medium">{name}</h3>
      <span className="rounded-full bg-brand-red px-2 py-1 text-xs text-white">{tag}</span>
    </article>
  );
}
