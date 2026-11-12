import Link from "next/link";
import { hubContext } from "@/lib/hub";
import { FILE_LABEL } from "@/lib/data";
import { hashmap } from "@/lib/hashmap";
import { n, shortDate } from "@/lib/format";
import { contactHref } from "@/lib/links";

const STATUS_LABEL = { contacted: "Contacted", do_not_contact: "Do not contact", bounced: "Bounced", unsubscribed: "Unsubscribed", staged: "Staged" } as const;

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { data, counts } = await hubContext();
  const map = await hashmap().catch(() => new Map());
  const needle = q.trim().toLowerCase();

  let results: { email: string; name: string; org: string }[] = [];
  if (needle.length >= 2) {
    const seen = new Map<string, { email: string; name: string; org: string }>();
    for (const s of data.sightings) {
      if (seen.has(s.email)) continue;
      if (`${s.email} ${s.name} ${s.org}`.toLowerCase().includes(needle)) seen.set(s.email, { email: s.email, name: s.name, org: s.org });
      if (seen.size >= 40) break;
    }
    if (seen.size < 40) for (const email of map.keys()) if (email.includes(needle) && !seen.has(email)) seen.set(email, { email, name: "", org: "" });
    results = [...seen.values()].slice(0, 40);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Contacts</h1>
        </div>
      </div>
      <form className="panel" action="/contacts" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <div className="field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="q">Email, name or firm</label>
          <input id="q" name="q" defaultValue={q} placeholder="e.g. a91partners.com or Ritu" autoFocus />
        </div>
        <button className="btn btn-action" type="submit">
          Search
        </button>
      </form>

      <div className="stack" style={{ marginTop: 16 }}>
        {needle.length < 2 && counts && (
          <section className="panel empty">
            <b>{n(counts.total)} emails on record.</b>
            {n(counts.contacted)} contacted, {n(counts.do_not_contact)} do not contact, {n(counts.bounced)} bounced, {n(counts.unsubscribed)} unsubscribed, {n(counts.staged)} staged.
          </section>
        )}
        {needle.length >= 2 && results.length === 0 && (
          <section className="panel empty">
            <b>No one matches &ldquo;{q}&rdquo;.</b>
            They aren&apos;t in any shared sheet or on record. <Link href="/check">Check a list</Link> to add new emails as staged.
          </section>
        )}
        {results.map((r) => {
          const doc = map.get(r.email);
          const seen = data.sightings.filter((s) => s.email === r.email);
          const stages = data.pipeline.filter((p) => p.email === r.email);
          return (
            <section className="panel" key={r.email}>
              <div className="panel-head">
                <h2 className="name-head">
                  <Link href={contactHref(r.email)}>{r.name || r.email}</Link>
                </h2>
                {doc ? (
                  <span className={`badge b-${doc.s}`}>
                    {STATUS_LABEL[doc.s as keyof typeof STATUS_LABEL]} · {doc.by} · {shortDate(doc.at)}
                  </span>
                ) : (
                  <span className="badge b-new">Not contacted before</span>
                )}
              </div>
              <p className="muted">{[r.email, r.org].filter(Boolean).join(" · ")}</p>
              {stages.map((p) => (
                <p key={p.key} style={{ marginTop: 6 }}>
                  Pipeline: <b>{p.stage ?? p.rawStage ?? "Unsorted"}</b> · {p.owner}
                  {p.next ? ` · next follow-up ${shortDate(p.next)}` : ""}
                  {p.remarks && <span className="sub">{p.remarks}</span>}
                </p>
              ))}
              {seen.length > 0 && (
                <div className="table-wrap" style={{ marginTop: 10 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Seen in</th>
                        <th>Owner</th>
                        <th>YAMM status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seen.map((s) => (
                        <tr key={s.file + s.tab + s.row}>
                          <td>
                            {s.tab}
                            <span className="sub">
                              {FILE_LABEL[s.file]} · row {s.row}
                            </span>
                          </td>
                          <td>{s.owner}</td>
                          <td>{s.merge ? s.merge.replace(/_/g, " ").toLowerCase() : <span className="muted">{s.file === "tracker" ? "tracked" : "not mailed"}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
