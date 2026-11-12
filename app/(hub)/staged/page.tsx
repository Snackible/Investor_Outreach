import Link from "next/link";
import { stagedEmails } from "@/lib/hashmap";
import { shortDate } from "@/lib/format";
import { inRange, isoDay, readRange } from "@/lib/range";
import { RangePicker } from "@/components/RangePicker";
import { StagedGroups } from "./StagedGroups";

export default async function StagedPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const range = readRange(await searchParams, "all");
  const all = await stagedEmails().catch(() => null);
  const docs = all?.filter((d) => inRange(d.at, range)) ?? null;
  const groups = new Map<string, { id: string; by: string; at: string; emails: string[] }>();
  for (const d of docs ?? []) {
    const id = d.up ?? "Unlabelled";
    const g = groups.get(id) ?? { id, by: d.by, at: shortDate(d.at), emails: [] };
    g.emails.push(d._id);
    groups.set(id, g);
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Staged</h1>
          <p>Not yet merged by YAMM, so not counted as used.</p>
        </div>
      </div>
      <section className="panel" style={{ marginBottom: 16 }}>
        <RangePicker
          label="Staged on"
          preset={range.preset}
          from={range.from && range.preset === "custom" ? isoDay(range.from) : ""}
          to={range.to && range.preset === "custom" ? isoDay(new Date(range.to.getTime() - 86400000)) : ""}
        />
      </section>
      {docs === null ? (
        <section className="panel empty">
          <b>The database couldn&apos;t be reached.</b>
          Check the MongoDB connection and reload.
        </section>
      ) : docs.length === 0 ? (
        <section className="panel empty">
          <b>{all && all.length ? `Nothing staged ${range.label.toLowerCase()}.` : "Nothing staged."}</b>
          <Link href="/check">Check a list</Link> and press Stage to keep its new emails here until they&apos;re mailed.
        </section>
      ) : (
        <StagedGroups groups={[...groups.values()]} total={docs.length} />
      )}
    </>
  );
}
