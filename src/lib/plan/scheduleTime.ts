/** API `startTime` → `<input type="time">`용 `HH:mm` */
export function normalizeStartTimeToHm(value: string): string {
  const v = value.trim();
  if (!v) return "08:00";
  const hm = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(v);
  if (hm) {
    const h = Math.min(23, Math.max(0, parseInt(hm[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(hm[2], 10)));
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return "08:00";
}
