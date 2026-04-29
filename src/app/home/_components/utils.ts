export function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };
  if (!startDate && !endDate) return "";
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}
