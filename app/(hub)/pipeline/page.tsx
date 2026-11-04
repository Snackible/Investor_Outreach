import { hubContext } from "@/lib/hub";
import { daysBetween, followUps, isOpen } from "@/lib/data";
import { STAGES } from "@/lib/parse";
import Link from "next/link";
import { contactHref } from "@/lib/links";
import { inRange, isoDay, readRange } from "@/lib/range";
import { RangePicker } from "@/components/RangePicker";
import { PipelineTable } from "./PipelineTable";

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ owner?: string; due?: string; sort?: string; field?: string; range?: string; from?: string; to?: string }> }) {
  const sp = await searchParams;
  const range = readRange(sp, "all");
  const field = sp.field === "last" ? "last" : "next";
  const { data } = await hubContext();
  const fu = followUps(data);
  const now = new Date();
  const counts = STAGES.map((s) => ({ stage: s, n: data.pipeline.filter((e) => e.stage === s).length }));
  const unknown = data.pipeline.filter((e) => !e.stage).length;
  const max = Math.max(1, ...counts.map((c) => c.n), unknown);
  const owners = [...new Set(data.pipeline.map((e) => e.owner))].sort();

  const dueKeys = new Set(fu.due.map((d) => d.key));
  const rows = data.pipeline.filter((e) => inRange(field === "last" ? e.last : e.next, range)).map((e) => ({
    href: contactHref(e.email, e.key),
    due: dueKeys.has(e.key),
    key: e.key,
    name: e.name,
    org: e.org,
    email: e.email,
    tab: e.tab,
    owner: e.owner,
    stage: e.stage ?? "Unsorted",
    rawStage: e.rawStage,
    open: isOpen(e),
    next: e.next ? e.next.toISOString() : null,
    late: e.next ? daysBetween(now, e.next) : null,
    last: e.last ? e.last.toISOString() : null,
    remarks: e.remarks,
  }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Pipeline</h1>
          <p>Read live from the Investor Tracker tabs. Stages are mapped from each tab&apos;s phase or status column onto one list.</p>
        </div>
      </div>
      <div className="cols">
        <section className="panel">
          <div className="panel-head">
            <h2>Stages</h2>
            <span>{data.pipeline.length} investors · one shared scale</span>
          </div>
          <div className="funnel">
            {counts.map((c) => (
              <div className={`funnel-row${["Converted", "Not interested", "Inactive", "Do not contact"].includes(c.stage) ? " closed" : ""}`} key={c.stage}>
                <span>{c.stage}</span>
                <i style={{ width: `${(c.n / max) * 100}%` }} />
                <b>{c.n}</b>
              </div>
            ))}
            {unknown > 0 && (
              <div className="funnel-row closed">
                <span>Unsorted</span>
                <i style={{ width: `${(unknown / max) * 100}%` }} />
                <b>{unknown}</b>
              </div>
            )}
          </div>
          <p className="panel-foot">Unsorted means the tab&apos;s status text didn&apos;t match a stage. Pick a stage in the sheet to sort it.</p>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Follow-ups by owner</h2>
            <span>
              {fu.dueToday} today · {fu.overdue} overdue · {fu.stale} stale
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Owner</th>
                  <th className="num">Due today</th>
                  <th className="num">Overdue</th>
                  <th className="num">Open investors</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((o) => {
                  const mine = fu.due.filter((d) => d.owner === o);
                  const open = data.pipeline.filter((e) => e.owner === o && isOpen(e)).length;
                  if (!open && !mine.length) return null;
                  return (
                    <tr key={o}>
                      <td>
                        <Link className="row-link" href={`/pipeline?owner=${encodeURIComponent(o)}&due=1`}>
                          {o}
                        </Link>
                      </td>
                      <td className="num">{mine.filter((d) => d.late === 0).length}</td>
                      <td className={`num${mine.some((d) => d.late > 0) ? " late" : ""}`}>{mine.filter((d) => d.late > 0).length}</td>
                      <td className="num">{open}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="panel-foot">Stale means the follow-up date passed more than 30 days ago.</p>
        </section>
      </div>
      <div style={{ marginTop: 22 }}>
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="filters" role="group" aria-label="Which date the range uses">
            <span className="range-label">Range uses</span>
            <Link className="chip" aria-pressed={field === "next"} href={{ query: { ...sp, field: "next" } }} scroll={false}>
              Next follow-up
            </Link>
            <Link className="chip" aria-pressed={field === "last"} href={{ query: { ...sp, field: "last" } }} scroll={false}>
              Last contact
            </Link>
          </div>
          <RangePicker
            label={field === "last" ? "Last contact" : "Next follow-up"}
            preset={range.preset}
            from={range.from && range.preset === "custom" ? isoDay(range.from) : ""}
            to={range.to && range.preset === "custom" ? isoDay(new Date(range.to.getTime() - 86400000)) : ""}
          />
        </section>
        <PipelineTable rows={rows} owners={owners} stages={[...STAGES, "Unsorted"]} initialOwner={sp.owner ?? "all"} initialStage={sp.due ? "due" : sp.sort === "recent" ? "all" : "open"} rangeLabel={range.preset === "all" ? null : range.label} />
      </div>
    </>
  );
}
