export type WeekBar = { start: Date; yamm: number; tracker: number };

/** Contacted per week, one stacked bar per week: YAMM merges (bat) over tracker activity (shell). */
export function WeekBars({ weeks }: { weeks: WeekBar[] }) {
  const W = 520, H = 220, B = 186, T = 18;
  const max = Math.max(1, ...weeks.map((w) => w.yamm + w.tracker));
  const slot = (W - 16) / Math.max(1, weeks.length);
  const bw = Math.max(4, Math.min(40, slot * 0.68));
  const labelEvery = Math.ceil(weeks.length / 7);
  const label = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <svg className="worm" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Contacted per week over ${weeks.length} weeks`}>
      <line x1="8" x2={W - 8} y1={B} y2={B} stroke="var(--rule)" />
      {weeks.map((w, i) => {
        const x = 8 + slot * i + (slot - bw) / 2;
        const ht = ((B - T) * w.tracker) / max;
        const hy = ((B - T) * w.yamm) / max;
        const last = i === weeks.length - 1;
        return (
          <g key={i} className="day-bar">
            <title>{`Week of ${label(w.start)}: ${w.yamm} merged by YAMM, ${w.tracker} logged in the tracker`}</title>
            <rect x={x} y={B - ht} width={bw} height={ht} fill="var(--shell)" opacity={last ? 1 : 0.85} />
            <rect x={x} y={B - ht - hy} width={bw} height={hy} fill="var(--bat)" />
            {w.yamm + w.tracker > 0 && (weeks.length <= 13 || last) && (
              <text x={x + bw / 2} y={B - ht - hy - 5} textAnchor="middle" style={{ fill: "var(--ink)", fontWeight: 700 }}>
                {w.yamm + w.tracker}
              </text>
            )}
            {(i % labelEvery === 0 || last) && (
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" style={last ? { fill: "var(--ink)", fontWeight: 700 } : undefined}>
                {last ? "This wk" : label(w.start)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
