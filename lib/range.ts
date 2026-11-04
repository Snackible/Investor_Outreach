export type Preset = "this-week" | "last-week" | "this-month" | "last-30" | "all" | "custom";

export type Range = {
  preset: Preset;
  /** Inclusive start, local midnight. Null for all time. */
  from: Date | null;
  /** Exclusive end, local midnight of the day after the last day. Null for all time. */
  to: Date | null;
  label: string;
};

export const PRESETS: { id: Exclude<Preset, "custom">; label: string }[] = [
  { id: "this-week", label: "This week" },
  { id: "last-week", label: "Last week" },
  { id: "this-month", label: "This month" },
  { id: "last-30", label: "Last 30 days" },
  { id: "all", label: "All time" },
];

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monday = (d: Date) => addDays(day(d), -((d.getDay() + 6) % 7));

export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseIsoDay(s: string | undefined): Date | null {
  const m = s?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Reads ?range=…&from=YYYY-MM-DD&to=YYYY-MM-DD into concrete dates. */
export function readRange(params: { range?: string; from?: string; to?: string }, fallback: Exclude<Preset, "custom"> = "all", now = new Date()): Range {
  const from = parseIsoDay(params.from);
  const to = parseIsoDay(params.to);
  if (params.range === "custom" || (!params.range && (from || to))) {
    const start = from ?? to!;
    const end = to ?? from!;
    const [a, b] = start <= end ? [start, end] : [end, start];
    return { preset: "custom", from: a, to: addDays(b, 1), label: `${fmt(a)} – ${fmt(b)}` };
  }
  const preset = (PRESETS.find((p) => p.id === params.range)?.id ?? fallback) as Exclude<Preset, "custom">;
  switch (preset) {
    case "this-week":
      return { preset, from: monday(now), to: addDays(monday(now), 7), label: "This week" };
    case "last-week":
      return { preset, from: addDays(monday(now), -7), to: monday(now), label: "Last week" };
    case "this-month":
      return { preset, from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1), label: "This month" };
    case "last-30":
      return { preset, from: addDays(day(now), -29), to: addDays(day(now), 1), label: "Last 30 days" };
    default:
      return { preset: "all", from: null, to: null, label: "All time" };
  }
}

export function inRange(d: Date | null | undefined, r: Range) {
  if (!r.from || !r.to) return true;
  return !!d && d >= r.from && d < r.to;
}

export function daysIn(r: Range): Date[] {
  if (!r.from || !r.to) return [];
  const out: Date[] = [];
  for (let d = r.from; d < r.to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}
