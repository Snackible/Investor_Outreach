"use client";

import Link from "next/link";
import { Fragment, useState } from "react";

type Group = { id: string; by: string; at: string; emails: string[] };

export function StagedGroups({ groups, total }: { groups: Group[]; total: number }) {
  const [open, setOpen] = useState<string | null>(groups[0]?.id ?? null);
  const [copied, setCopied] = useState<string | null>(null);
  const [by, setBy] = useState("all");
  const people = [...new Set(groups.map((g) => g.by))].sort();
  const shown = groups.filter((g) => by === "all" || g.by === by);

  async function copy(g: Group) {
    await navigator.clipboard.writeText(g.emails.join("\n"));
    setCopied(g.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{total.toLocaleString("en-IN")} staged</h2>
        <span>{groups.length} uploads</span>
      </div>
      <div className="filters">
        <select className="inline" value={by} onChange={(e) => setBy(e.target.value)} aria-label="Staged by">
          <option value="all">Everyone</option>
          {people.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Upload</th>
              <th>Staged by</th>
              <th className="hide-sm">Date</th>
              <th className="num">Emails</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((g) => (
              <Fragment key={g.id}>
                <tr>
                  <td>
                    <button type="button" className="chip" aria-expanded={open === g.id} onClick={() => setOpen(open === g.id ? null : g.id)}>
                      {g.id}
                    </button>
                  </td>
                  <td>{g.by}</td>
                  <td className="hide-sm">{g.at}</td>
                  <td className="num">{g.emails.length}</td>
                  <td className="num">
                    <button type="button" className="btn btn-line" style={{ minHeight: 32, fontSize: 14 }} onClick={() => copy(g)}>
                      {copied === g.id ? "Copied" : "Copy emails"}
                    </button>
                  </td>
                </tr>
                {open === g.id && (
                  <tr key={g.id + "-list"}>
                    <td colSpan={5} className="email-columns" style={{ columns: "260px", columnGap: 24, color: "var(--muted)" }}>
                      {g.emails.slice(0, 400).map((e) => (
                        <div key={e}>
                          <Link href={`/contacts/${encodeURIComponent(e)}`}>{e}</Link>
                        </div>
                      ))}
                      {g.emails.length > 400 && <div>…and {g.emails.length - 400} more (copy to get them all)</div>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
