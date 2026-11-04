export const n = (v: number) => v.toLocaleString("en-IN");

export const pct = (part: number, whole: number, digits = 1) => (whole ? `${((part / whole) * 100).toFixed(digits)}%` : "–");

export function shortDate(d: Date | null | undefined) {
  return d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "–";
}

export function lateLabel(days: number) {
  if (days <= 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"} late`;
}

export function ago(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h ago` : shortDate(d);
}
