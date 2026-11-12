import Link from "next/link";
import { notFound } from "next/navigation";
import { hubContext } from "@/lib/hub";
import { daysBetween, FILE_LABEL, isOpen } from "@/lib/data";
import { hashmap } from "@/lib/hashmap";
import { domainOf, isFirmDomain } from "@/lib/emails";
import { shortDate } from "@/lib/format";
import { campaignHref, contactHref } from "@/lib/links";
import { BackLink } from "@/components/BackLink";

const STATUS_LABEL = { contacted: "Contacted", do_not_contact: "Do not contact", bounced: "Bounced", unsubscribed: "Unsubscribed", staged: "Staged" } as const;

export default async function InvestorPage({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id);
  const { data } = await hubContext();
  const map = await hashmap().catch(() => new Map());

  const byKey = id.startsWith("p~") ? data.pipeline.find((p) => p.key === id.slice(2)) : undefined;
  const email = byKey ? byKey.email : id.toLowerCase();
  const sightings = email ? data.sightings.filter((s) => s.email === email) : [];
  const pipeline = data.pipeline.filter((p) => (email && p.email === email) || p.key === byKey?.key);
  const doc = email ? map.get(email) : undefined;
  if (!byKey && sightings.length === 0 && pipeline.length === 0 && !doc) notFound();

  const name = pipeline[0]?.name || sightings.find((s) => s.name)?.name || email;
  const org = pipeline[0]?.org || sightings.find((s) => s.org)?.org || "";
  const campaignTabs = new Set(data.campaigns.map((c) => c.file + "|" + c.tab));
  const domain = email ? domainOf(email) : "";
  const colleagues =
    email && isFirmDomain(domain)
      ? [...new Map(data.sightings.filter((s) => s.email !== email && domainOf(s.email) === domain).map((s) => [s.email, s])).values()].slice(0, 12)
      : [];
  const now = new Date();

  return (
    <>
      <BackLink fallback="/contacts" />
      <div className="page-head">
        <div>
          <h1 className="name-head">{name}</h1>
          <p>{[email, org].filter(Boolean).join(" · ") || "No email on file"}</p>
        </div>
        {email &&
          (doc ? (
            <span className={`badge b-${doc.s}`}>
              {STATUS_LABEL[doc.s as keyof typeof STATUS_LABEL]} · {doc.by} · {doc.bf ? "before tracking began" : shortDate(doc.at)}
            </span>
          ) : (
            <span className="badge b-new">Not contacted before</span>
          ))}
      </div>

      <div className="cols">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Pipeline</h2>
              <span>{pipeline.length ? `${pipeline.length} tracker ${pipeline.length === 1 ? "row" : "rows"}` : "not in the tracker"}</span>
            </div>
            {pipeline.length === 0 ? (
              <div className="empty">
                <b>Not being tracked.</b>
                Add them to a tracker tab in the Investor Tracker to follow up.
              </div>
            ) : (
              pipeline.map((p) => {
                const late = p.next ? daysBetween(now, p.next) : null;
                return (
                  <dl className="facts" key={p.key}>
                    <dt>Stage</dt>
                    <dd>
                      <b>{p.stage ?? "Unsorted"}</b>
                      {p.rawStage && p.rawStage !== p.stage && <span className="sub">Sheet says: {p.rawStage}</span>}
                    </dd>
                    <dt>Owner</dt>
                    <dd>
                      <Link href={`/pipeline?owner=${encodeURIComponent(p.owner)}`}>{p.owner}</Link>
                    </dd>
                    <dt>Next follow-up</dt>
                    <dd className={isOpen(p) && late !== null && late > 0 ? "late" : undefined}>
                      {p.next ? shortDate(p.next) : p.nextRaw || "–"}
                      {isOpen(p) && late !== null && late > 0 && ` · ${late} days late`}
                    </dd>
                    <dt>Last contact</dt>
                    <dd>{shortDate(p.last)}</dd>
                    <dt>Notes</dt>
                    <dd>{p.remarks || "–"}</dd>
                    <dt>Tracker tab</dt>
                    <dd className="muted">
                      {p.tab}, row {p.key.split(":").pop()}
                    </dd>
                  </dl>
                );
              })
            )}
          </section>
          {colleagues.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <h2>Same firm</h2>
                <span>@{domain}</span>
              </div>
              <ul className="link-list">
                {colleagues.map((s) => (
                  <li key={s.email}>
                    <Link href={contactHref(s.email)}>{s.name || s.email}</Link>
                    <span className="sub">{s.email}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Lists and campaigns</h2>
            <span>{sightings.length ? `seen in ${sightings.length} ${sightings.length === 1 ? "place" : "places"}` : "no email on any list"}</span>
          </div>
          {sightings.length === 0 ? (
            <div className="empty">
              <b>Not on any shared list.</b>
              {email ? "Check the Master Investor Sheet is shared with the hub." : "This tracker row has no email, so it can't be matched to lists."}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tab</th>
                    <th>Owner</th>
                    <th>YAMM status</th>
                    <th className="hide-sm">Before that</th>
                  </tr>
                </thead>
                <tbody>
                  {sightings.map((s) => (
                    <tr key={s.file + s.tab + s.row}>
                      <td>
                        {campaignTabs.has(s.file + "|" + s.tab) ? (
                          <Link className="row-link" href={campaignHref(s.file, s.tab)}>
                            {s.tab}
                          </Link>
                        ) : (
                          s.tab
                        )}
                        <span className="sub">
                          {FILE_LABEL[s.file]} · row {s.row}
                        </span>
                      </td>
                      <td>{s.owner}</td>
                      <td>{s.merge ? s.merge.replace(/_/g, " ").toLowerCase() : <span className="muted">{s.file === "tracker" ? "tracked" : "not mailed"}</span>}</td>
                      <td className="hide-sm muted">{s.prevMerge ? s.prevMerge.replace(/_/g, " ").toLowerCase() : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
