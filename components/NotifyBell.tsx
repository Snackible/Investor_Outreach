"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { contactHref } from "@/lib/links";

export type DueItem = { key: string; name: string; org: string; email: string; owner: string; late: number };

/** A bell with the count of due/overdue follow-ups and a quick-glance list. No new storage: reads the same follow-ups data the score bug uses. */
export function NotifyBell({ items, overdue }: { items: DueItem[]; overdue: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="notify-bell" ref={ref}>
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
          <path
            d="M10 2.5c-2.3 0-4 1.9-4 4.3v2.6c0 .6-.2 1.2-.6 1.7l-1 1.3c-.5.6-.1 1.6.7 1.6h9.8c.8 0 1.2-1 .7-1.6l-1-1.3c-.4-.5-.6-1.1-.6-1.7V6.8c0-2.4-1.7-4.3-4-4.3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 15.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {items.length > 0 && <span className={`notify-count${overdue > 0 ? " late" : ""}`}>{items.length > 99 ? "99+" : items.length}</span>}
      </button>
      {open && (
        <div className="notify-pop" role="menu">
          <div className="notify-pop-head">
            <b>Follow-ups due</b>
            <span className="muted">{items.length === 0 ? "Nothing due" : `${items.length} investor${items.length === 1 ? "" : "s"}`}</span>
          </div>
          {items.length === 0 ? (
            <p className="notify-empty">You&apos;re caught up.</p>
          ) : (
            <ul>
              {items.slice(0, 8).map((it) => (
                <li key={it.key}>
                  <Link href={contactHref(it.email, it.key)} onClick={() => setOpen(false)}>
                    <span className="notify-name">{it.name}</span>
                    <span className="notify-meta">
                      {it.org || it.owner} · {it.late === 0 ? "due today" : `${it.late}d late`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/pipeline?due=1" className="notify-all" onClick={() => setOpen(false)}>
            See all in Pipeline
          </Link>
        </div>
      )}
    </div>
  );
}
