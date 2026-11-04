"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Row = {
  tab: string;
  fileLabel: string;
  owner: string;
  listed: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  href: string;
  date: string | null;
};

type Key = "tab" | "date" | "owner" | "sent" | "openRate" | "replyRate" | "bounceRate" | "replied";

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const fmt = (v: number) => `${v.toFixed(1)}%`;

function Arrow({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden style={{ opacity: dir ? 1 : 0.35 }}>
      <path d={dir === "asc" ? "M1 7 L5 3 L9 7" : "M1 3 L5 7 L9 3"} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function CampaignTable({ rows }: { rows: Row[] }) {
  const [owner, setOwner] = useState("all");
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "sent", dir: "desc" });
  const owners = useMemo(() => [...new Set(rows.map((r) => r.owner))].sort(), [rows]);

  const shown = useMemo(() => {
    const list = rows
      .filter((r) => owner === "all" || r.owner === owner)
      .map((r) => ({ ...r, openRate: pct(r.opened, r.sent), replyRate: pct(r.replied, r.sent), bounceRate: pct(r.bounced, r.sent) }));
    const m = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const x = a[sort.key] ?? "", y = b[sort.key] ?? "";
      return (typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number)) * m;
    });
  }, [rows, owner, sort]);

  const t = shown.reduce(
    (a, r) => ({ sent: a.sent + r.sent, opened: a.opened + r.opened, replied: a.replied + r.replied, bounced: a.bounced + r.bounced, unsub: a.unsub + r.unsubscribed }),
    { sent: 0, opened: 0, replied: 0, bounced: 0, unsub: 0 }
  );

  const head = (key: Key, label: string, num = true, hideSm = false) => (
    <th className={[num ? "num" : "", hideSm ? "hide-sm" : ""].join(" ").trim() || undefined} aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" aria-pressed={sort.key === key} onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))}>
        {label}
        <Arrow dir={sort.key === key ? sort.dir : null} />
      </button>
    </th>
  );

  return (
    <div className="stack">
      <section className="tally" aria-label="All campaigns">
        <div>
          <small>Sent</small>
          <b>{t.sent.toLocaleString("en-IN")}</b>
        </div>
        <div>
          <small>Opened</small>
          <b>{fmt(pct(t.opened, t.sent))}</b>
        </div>
        <div>
          <small>Replied</small>
          <b>{fmt(pct(t.replied, t.sent))}</b>
        </div>
        <div>
          <small>Bounced</small>
          <b>{fmt(pct(t.bounced, t.sent))}</b>
        </div>
        <div>
          <small>Unsubscribed</small>
          <b>{t.unsub}</b>
        </div>
        <div>
          <small>Tabs</small>
          <b>{shown.length}</b>
        </div>
      </section>
      <section className="panel">
        <div className="filters">
          <label htmlFor="owner" className="muted">
            Owner
          </label>
          <select id="owner" className="inline" value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="all">Everyone</option>
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {head("tab", "Tab", false)}
                {head("date", "Date", false, true)}
                {head("owner", "Owner", false, true)}
                {head("sent", "Sent")}
                {head("openRate", "Opened", true, true)}
                {head("replied", "Replies", true, true)}
                {head("replyRate", "Reply rate")}
                {head("bounceRate", "Bounced")}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.fileLabel + r.tab}>
                  <td>
                    <Link className="row-link" href={r.href}>
                      {r.tab}
                    </Link>
                    <span className="sub">
                      {r.fileLabel} · {r.listed.toLocaleString("en-IN")} listed
                    </span>
                    <span className="sub hide-lg">
                      {r.owner} · {r.openRate.toFixed(1)}% opened · {r.replied} replies
                    </span>
                  </td>
                  <td className="muted hide-sm">{r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "–"}</td>
                  <td className="hide-sm">{r.owner}</td>
                  <td className="num">{r.sent.toLocaleString("en-IN")}</td>
                  <td className="num hide-sm">{fmt(r.openRate)}</td>
                  <td className="num hide-sm">{r.replied}</td>
                  <td className="num">{fmt(r.replyRate)}</td>
                  <td className={`num${r.bounceRate >= 5 ? " late" : ""}`}>
                    {fmt(r.bounceRate)}
                    <span className="sub">
                      {r.bounced} email{r.bounced === 1 ? "" : "s"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-foot">5%+ bounce rate highlighted.</p>
      </section>
    </div>
  );
}
