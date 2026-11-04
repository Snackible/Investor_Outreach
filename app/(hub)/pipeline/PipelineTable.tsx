"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StageChip } from "@/components/StageChip";

type Row = {
  key: string;
  href: string;
  due: boolean;
  name: string;
  org: string;
  email: string;
  tab: string;
  owner: string;
  stage: string;
  rawStage: string;
  open: boolean;
  next: string | null;
  late: number | null;
  last: string | null;
  remarks: string;
};

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "–");

export function PipelineTable({ rows, owners, stages, initialOwner, initialStage, rangeLabel }: { rows: Row[]; owners: string[]; stages: string[]; initialOwner: string; initialStage: string; rangeLabel: string | null }) {
  const [owner, setOwner] = useState(initialOwner);
  const [stage, setStage] = useState(initialStage);
  useEffect(() => setOwner(initialOwner), [initialOwner]);
  useEffect(() => setStage(initialStage), [initialStage]);
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => owner === "all" || r.owner === owner)
      .filter((r) => (stage === "open" ? r.open : stage === "due" ? r.due : stage === "all" ? true : r.stage === stage))
      .filter((r) => !needle || `${r.name} ${r.org} ${r.email}`.toLowerCase().includes(needle))
      .sort((a, b) =>
        stage === "due"
          ? (b.late ?? -9999) - (a.late ?? -9999)
          : (b.last ? Date.parse(b.last) : 0) - (a.last ? Date.parse(a.last) : 0) || Number(b.key.split(":").pop()) - Number(a.key.split(":").pop())
      );
  }, [rows, owner, stage, q]);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Investors</h2>
        <span>
          {shown.length} of {rows.length}
          {rangeLabel ? ` · ${rangeLabel.toLowerCase()}` : ""}
        </span>
      </div>
      <div className="filters">
        <input className="inline search" placeholder="Search name, firm or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search investors" />
        <select className="inline" value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Stage">
          <option value="due">Due or overdue</option>
          <option value="open">Open stages</option>
          <option value="all">All stages</option>
          {stages.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="inline" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner">
          <option value="all">Everyone</option>
          {owners.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      {shown.length === 0 ? (
        <div className="empty">
          <b>No investors match.</b>
          Clear the search or pick another stage.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Investor</th>
                <th>Stage</th>
                <th>Owner</th>
                <th>Next follow-up</th>
                <th className="hide-sm">Last contact</th>
                <th className="hide-sm">Notes</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 300).map((r) => (
                <tr key={r.key}>
                  <td>
                    <Link className="row-link" href={r.href}>
                      {r.name}
                    </Link>
                    <span className="sub">{[r.org, r.email].filter(Boolean).join(" · ") || r.tab}</span>
                    {r.remarks && <span className="sub hide-lg">{r.remarks}</span>}
                  </td>
                  <td>
                    <StageChip stage={r.stage === "Unsorted" ? null : r.stage} raw={r.rawStage} />
                  </td>
                  <td>{r.owner}</td>
                  <td className={r.open && r.late !== null && r.late > 0 ? "late" : undefined}>
                    {date(r.next)}
                    {r.open && r.late !== null && r.late > 0 && <span className="sub">{r.late} days late</span>}
                  </td>
                  <td className="hide-sm">{date(r.last)}</td>
                  <td className="hide-sm" style={{ maxWidth: 360 }}>
                    {r.remarks || "–"}
                    <span className="sub">{r.tab}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {shown.length > 300 && <p className="panel-foot">Showing 300 of {shown.length}. Narrow the filters to see the rest.</p>}
    </section>
  );
}
