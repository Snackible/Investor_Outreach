"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type BugProps = {
  week: number;
  thisWeek: number;
  today: number;
  lastWeek: number;
  dueToday: number;
  overdue: number;
  replyRate: number | null;
};

/**
 * Rolls a figure from its previous value to the new one when the score changes
 * after a sync. First render shows the real figure; reduced motion snaps.
 */
function useRoll(value: number, ms = 900) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setShown(Math.round(from + (value - from) * (1 - Math.pow(2, -10 * p))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

/** The broadcast score bug: this week's outreach and what needs doing today, on every screen. */
export function ScoreBug({ week, thisWeek, today, lastWeek, dueToday, overdue, replyRate }: BugProps) {
  const rolled = useRoll(thisWeek);
  const rolledToday = useRoll(today);
  return (
    <section className="bug" aria-label={`Week ${week}: ${thisWeek} contacted, ${today} today`}>
      <div className="bug-bat">
        <small>Week {week} · contacted</small>
        <b>{rolled}</b>
      </div>
      <div className="bug-need">
        <em>{rolledToday}</em>today
        <span className="bug-sep" aria-hidden />
        <em className="dim">{lastWeek}</em>last week
      </div>
      <Link className="bug-stat" href="/pipeline?due=1">
        <small>Follow-ups due</small>
        <b>
          {dueToday + overdue}
          {overdue > 0 && <span className="behind"> {overdue} late</span>}
        </b>
      </Link>
      <Link className="bug-stat" href="/campaigns">
        <small>Reply rate</small>
        <b className="proj">{replyRate === null ? "–" : `${replyRate.toFixed(1)}%`}</b>
      </Link>
    </section>
  );
}
