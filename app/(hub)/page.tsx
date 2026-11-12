import Link from "next/link";
import { hubContext } from "@/lib/hub";
import { contactedIn, trackingStarted } from "@/lib/hashmap";
import { ago, lateLabel, n, shortDate } from "@/lib/format";
import { contactHref } from "@/lib/links";
import { WeekBars } from "@/components/WeekBars";
import { SyncButton } from "@/components/SyncButton";
import { QuickCheck } from "@/components/QuickCheck";
import { StageChip } from "@/components/StageChip";

const WEEK_OPTIONS = [4, 12, 26, 52];

const monday = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));

export default async function Overview({ searchParams }: { searchParams: Promise<{ weeks?: string }> }) {
  const sp = await searchParams;
  const ctx = await hubContext();
  const count = WEEK_OPTIONS.includes(Number(sp.weeks)) ? Number(sp.weeks) : 12;
  const thisMonday = monday(new Date());
  const from = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - 7 * (count - 1));
  const to = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() + 7);
  const [contacted, started] = await Promise.all([contactedIn(from, to).catch(() => null), trackingStarted().catch(() => null)]);

  // One bar per week, Monday to Sunday: YAMM merges seen by the hub, plus investors whose latest
  // "Last mailed" date on the tracker falls in that week (the only dated history in the sheets).
  const weeks = Array.from({ length: count }, (_, i) => ({ start: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7 * i), yamm: 0, tracker: 0 }));
  const weekOf = (d: Date) => Math.round((monday(d).getTime() - from.getTime()) / (7 * 86400000));
  for (const [day, k] of contacted?.byDay ?? []) {
    const i = weekOf(new Date(day + "T00:00:00"));
    if (weeks[i]) weeks[i].yamm += k;
  }
  const owners = new Map<string, number>();
  for (const o of contacted?.byOwner ?? []) owners.set(o.owner, (owners.get(o.owner) ?? 0) + o.n);
  for (const e of ctx.data.pipeline) {
    if (!e.last || e.last < from || e.last >= to) continue;
    const i = weekOf(e.last);
    if (weeks[i]) weeks[i].tracker++;
    if (e.owner !== "Team") owners.set(e.owner, (owners.get(e.owner) ?? 0) + 1);
  }
  const total = weeks.reduce((a, w) => a + w.yamm + w.tracker, 0);
  const current = weeks[weeks.length - 1];

  const fu = ctx.followUps;
  // Most recent conversations first, straight from the tracker: status chip plus the latest remark.
  const latest = [...ctx.data.pipeline]
    .filter((e) => e.last || e.remarks)
    .sort((a, b) => (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0) || Number(b.key.split(":").pop()) - Number(a.key.split(":").pop()))
    .slice(0, 12);
  const c = ctx.counts;

  const board = owners.size
    ? [...owners].map(([owner, k]) => ({ owner, n: k })).sort((a, b) => b.n - a.n)
    : [...new Set(ctx.data.pipeline.map((e) => e.owner))].filter((o) => o !== "Team").sort().map((owner) => ({ owner, n: 0 }));
  const maxOwner = Math.max(1, ...board.map((o) => o.n));

  return (
    <>
      <div className="page-head">
        <h1>Overview</h1>
        <SyncButton lastSync={ctx.sync ? ago(ctx.sync.at) : null} />
      </div>

      <div className="cols">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Contacted per week</h2>
              <span>
                <b className="figure">{n(current.yamm + current.tracker)}</b> this week · {n(total)} in {count} weeks
              </span>
            </div>
            <div className="range" role="group" aria-label="Weeks shown">
              <span className="range-label">Show</span>
              {WEEK_OPTIONS.map((w) => (
                <Link key={w} className="chip" aria-pressed={w === count} href={w === 12 ? "/" : `/?weeks=${w}`} scroll={false}>
                  {w} weeks
                </Link>
              ))}
            </div>
            <WeekBars weeks={weeks} />
            <p className="panel-foot">
              <span className="key key-bat" /> Merged by YAMM{started ? ` (counted from ${shortDate(started)})` : ""}
              <span className="key key-shell" /> Latest contact logged on the Email List tab
            </p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Team scorecard</h2>
              <span>contacted · last {count} weeks</span>
            </div>
            {board.map((o) => (
              <Link className="score-row" key={o.owner} href={`/pipeline?owner=${encodeURIComponent(o.owner)}`}>
                <span>{o.owner}</span>
                {o.n > 0 ? <i style={{ width: `${(o.n / maxOwner) * 100}%` }} /> : <span />}
                <b>{o.n}</b>
              </Link>
            ))}
            {c && (
              <p className="panel-foot">
                <b>{n(c.total)}</b> emails on record · {n(c.contacted)} contacted · {n(c.do_not_contact)} do not contact · {n(c.bounced)} bounced ·{" "}
                <Link href="/staged">{n(c.staged)} staged</Link>
              </p>
            )}
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Latest conversations</h2>
              <Link href="/pipeline?sort=recent">all {ctx.data.pipeline.length} in the pipeline</Link>
            </div>
            {latest.length === 0 ? (
              <div className="empty">
                <b>No conversations logged yet.</b>
                Add a last-mailed date or a remark on the Email List tab.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Investor</th>
                      <th>Status</th>
                      <th className="hide-sm">Latest note</th>
                      <th className="num">Last</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((e) => (
                      <tr key={e.key}>
                        <td>
                          <Link className="row-link" href={contactHref(e.email, e.key)}>
                            {e.name}
                          </Link>
                          <span className="sub">{[e.org, e.owner !== "Team" ? e.owner : ""].filter(Boolean).join(" · ") || e.email}</span>
                          {e.remarks && <span className="sub hide-lg">{e.remarks}</span>}
                        </td>
                        <td>
                          <StageChip stage={e.stage} raw={e.rawStage} />
                        </td>
                        <td className="hide-sm note">{e.remarks || "–"}</td>
                        <td className="num due muted">{e.last ? shortDate(e.last) : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Follow-ups due</h2>
              <Link href="/pipeline?due=1">
                {fu.dueToday} today · {fu.overdue} overdue{fu.stale ? ` · ${fu.stale} stale` : ""}
              </Link>
            </div>
            {fu.due.length === 0 ? (
              <div className="empty">
                <b>Nothing due in the last 30 days.</b>
                {fu.stale ? `${fu.stale} investors have follow-up dates more than 30 days old. ` : ""}
                <Link href="/pipeline">Open the pipeline</Link> to set new dates.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Investor</th>
                      <th className="hide-sm">Firm</th>
                      <th className="hide-sm">Stage</th>
                      <th>Owner</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fu.due.slice(0, 9).map((e) => (
                      <tr key={e.key}>
                        <td>
                          <Link className="row-link" href={contactHref(e.email, e.key)}>
                            {e.name}
                          </Link>
                          <span className="sub hide-lg">{[e.org, e.stage ?? e.rawStage].filter(Boolean).join(" · ")}</span>
                        </td>
                        <td className="hide-sm">{e.org || "–"}</td>
                        <td className="hide-sm">
                          <StageChip stage={e.stage} raw={e.rawStage} />
                        </td>
                        <td>{e.owner}</td>
                        <td className={`due${e.late > 0 ? " late" : ""}`}>{lateLabel(e.late)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {fu.due.length > 9 && (
              <p className="panel-foot">
                <Link href="/pipeline?due=1">{fu.due.length - 9} more in the pipeline</Link>
              </p>
            )}
          </section>
          <QuickCheck />
        </div>
      </div>
    </>
  );
}
