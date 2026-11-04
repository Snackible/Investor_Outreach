import Link from "next/link";
import { notFound } from "next/navigation";
import { hubContext } from "@/lib/hub";
import { FILE_LABEL, type SourceFile } from "@/lib/data";
import { tabFirstMerged } from "@/lib/hashmap";
import { shortDate } from "@/lib/format";
import { campaignHref, contactHref } from "@/lib/links";
import { BackLink } from "@/components/BackLink";

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "sent", label: "Sent only", test: (m: string) => /EMAIL_SENT/.test(m) },
  { id: "opened", label: "Opened", test: (m: string) => /OPENED|CLICKED|RESPONDED/.test(m) },
  { id: "replied", label: "Replied", test: (m: string) => /RESPONDED/.test(m) },
  { id: "bounced", label: "Bounced", test: (m: string) => /BOUNCED/.test(m) },
  { id: "unsubscribed", label: "Unsubscribed", test: (m: string) => /UNSUBSCRIBED/.test(m) },
  { id: "unmailed", label: "Not mailed", test: (m: string) => !m },
] as const;

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "–");

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ file: string; tab: string }>; searchParams: Promise<{ status?: string }> }) {
  const { file, tab: rawTab } = await params;
  const { status = "all" } = await searchParams;
  const tab = decodeURIComponent(rawTab);
  if (!(file in FILE_LABEL)) notFound();
  const { data } = await hubContext();
  const c = data.campaigns.find((x) => x.file === file && x.tab === tab);
  if (!c) notFound();
  const first = (await tabFirstMerged().catch(() => new Map<string, Date>())).get(tab);
  const rows = data.sightings.filter((s) => s.file === (file as SourceFile) && s.tab === tab);
  const filter = FILTERS.find((f) => f.id === status) ?? FILTERS[0];
  const shown = rows.filter((r) => filter.test(r.merge));
  const href = campaignHref(c.file, c.tab);

  return (
    <>
      <BackLink fallback="/campaigns" label="Campaigns" />
      <div className="page-head">
        <div>
          <h1 className="name-head">{c.tab}</h1>
          <p>
            {FILE_LABEL[c.file]} · owner {c.owner} · {first ? `first seen merged ${shortDate(first)}` : "merged before tracking began"}
          </p>
        </div>
      </div>
      <section className="tally" aria-label="Campaign results">
        <div>
          <small>Sent</small>
          <b>{c.sent}</b>
        </div>
        <div>
          <small>Opened</small>
          <b>{pct(c.opened, c.sent)}</b>
        </div>
        <div>
          <small>Replied</small>
          <b>{c.replied}</b>
        </div>
        <div>
          <small>Bounced</small>
          <b>{pct(c.bounced, c.sent)}</b>
        </div>
        <div>
          <small>Unsubscribed</small>
          <b>{c.unsubscribed}</b>
        </div>
        <div>
          <small>Not mailed</small>
          <b>{c.listed - c.sent}</b>
        </div>
      </section>
      <section className="panel">
        <div className="filters" role="group" aria-label="Filter by YAMM status">
          {FILTERS.map((f) => {
            const n = rows.filter((r) => f.test(r.merge)).length;
            if (f.id !== "all" && n === 0) return null;
            return (
              <Link key={f.id} className="chip" aria-pressed={filter.id === f.id} href={f.id === "all" ? href : `${href}?status=${f.id}`} scroll={false}>
                {f.label}
                <b>{n}</b>
              </Link>
            );
          })}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Investor</th>
                <th className="hide-sm">Firm</th>
                <th>YAMM status</th>
                <th className="hide-sm">Before that</th>
                <th className="num hide-sm">Row</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 500).map((r) => (
                <tr key={r.row + r.email}>
                  <td>
                    <Link className="row-link" href={contactHref(r.email)}>
                      {r.name || r.email}
                    </Link>
                    <span className="sub">{r.email}</span>
                  </td>
                  <td className="hide-sm">{r.org || "–"}</td>
                  <td className={/BOUNCED/.test(r.merge) ? "late" : /RESPONDED/.test(r.merge) ? "ok" : undefined}>
                    {r.merge ? r.merge.replace(/_/g, " ").toLowerCase() : <span className="muted">not mailed</span>}
                  </td>
                  <td className="hide-sm muted">{r.prevMerge ? r.prevMerge.replace(/_/g, " ").toLowerCase() : "–"}</td>
                  <td className="num hide-sm muted">{r.row}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown.length > 500 && <p className="panel-foot">Showing 500 of {shown.length}. Use a status filter to narrow it.</p>}
      </section>
    </>
  );
}
