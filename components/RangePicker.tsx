"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PRESETS, type Preset } from "@/lib/range";

/** Preset chips plus a custom from–to, kept in the URL so a range can be shared or bookmarked. */
export function RangePicker({ preset, from, to, label = "Dates" }: { preset: Preset; from: string; to: string; label?: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [a, setA] = useState(from);
  const [b, setB] = useState(to);

  const go = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v === null ? p.delete(k) : p.set(k, v));
    router.push(`${path}?${p.toString()}`, { scroll: false });
  };

  return (
    <div className="range" role="group" aria-label={label}>
      <span className="range-label">{label}</span>
      {PRESETS.map((p) => (
        <button key={p.id} type="button" className="chip" aria-pressed={preset === p.id} onClick={() => go({ range: p.id, from: null, to: null })}>
          {p.label}
        </button>
      ))}
      <form
        className="range-custom"
        onSubmit={(e) => {
          e.preventDefault();
          if (a || b) go({ range: "custom", from: a || b, to: b || a });
        }}
      >
        <label className="visually-hidden" htmlFor="range-from">
          From
        </label>
        <input id="range-from" type="date" value={a} max={b || undefined} onChange={(e) => setA(e.target.value)} />
        <span aria-hidden>–</span>
        <label className="visually-hidden" htmlFor="range-to">
          To
        </label>
        <input id="range-to" type="date" value={b} min={a || undefined} onChange={(e) => setB(e.target.value)} />
        <button type="submit" className={`chip${preset === "custom" ? " on" : ""}`} aria-pressed={preset === "custom"} disabled={!a && !b}>
          Apply
        </button>
      </form>
    </div>
  );
}
