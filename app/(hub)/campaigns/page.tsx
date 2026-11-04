import { hubContext } from "@/lib/hub";
import { FILE_LABEL } from "@/lib/data";
import { tabFirstMerged } from "@/lib/hashmap";
import { parseDate } from "@/lib/parse";
import { campaignHref } from "@/lib/links";
import { inRange, isoDay, readRange } from "@/lib/range";
import { RangePicker } from "@/components/RangePicker";
import { CampaignTable } from "./CampaignTable";

/** A date written in the tab name ("13/07", "Family Office list 22/9/26", "HNI - 25OCT"), when there is one. */
function dateInTabName(tab: string, now: Date) {
  const slash = tab.match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/);
  if (slash) return parseDate(slash[1].split("/").length === 2 ? `${slash[1]}/${now.getFullYear()}` : slash[1], now);
  const dayMonth = tab.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i);
  if (dayMonth) return parseDate(`${dayMonth[1]} ${dayMonth[2]}`, now);
  const monthDay = tab.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})\b/i);
  if (!monthDay) return null;
  return parseDate(`${monthDay[2]} ${monthDay[1]}`, now);
}

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const sp = await searchParams;
  const range = readRange(sp, "all");
  const { data } = await hubContext();
  const first = await tabFirstMerged().catch(() => new Map<string, Date>());
  const now = new Date();
  const all = data.campaigns.map((c) => {
    const date = dateInTabName(c.tab, now) ?? first.get(c.tab) ?? null;
    return { ...c, fileLabel: FILE_LABEL[c.file], href: campaignHref(c.file, c.tab), date: date ? date.toISOString() : null, inRange: inRange(date, range) };
  });
  const rows = all.filter((r) => r.inRange);
  // YAMM keeps no send date, so older tabs have none. Keep them visible under any range instead of hiding them.
  const undated = range.preset !== "all" ? all.filter((r) => !r.date) : [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Campaigns</h1>
          <p>Every tab YAMM has merged, read live from the sheets. Rates use YAMM&apos;s latest status per email, so opens include anyone who later clicked or replied.</p>
        </div>
      </div>
      <section className="panel" style={{ marginBottom: 16 }}>
        <RangePicker
          label="Campaign date"
          preset={range.preset}
          from={range.from && range.preset === "custom" ? isoDay(range.from) : ""}
          to={range.to && range.preset === "custom" ? isoDay(new Date(range.to.getTime() - 86400000)) : ""}
        />
        <p className="panel-foot" style={{ marginTop: 4 }}>
          A campaign&apos;s date is the date in its tab name, or the day the hub first saw it merged.
          {undated.length > 0 && ` YAMM doesn't record send dates, so ${undated.length} older tabs have none; they're listed separately below.`}
        </p>
      </section>
      {all.length === 0 ? (
        <section className="panel empty">
          <b>No YAMM tabs found yet.</b>
          Campaign tabs appear here once a sheet with a Merge status column is shared with the hub.
        </section>
      ) : rows.length === 0 ? (
        <section className="panel empty" style={{ marginBottom: 16 }}>
          <b>No dated campaigns {range.label.toLowerCase()}.</b>
          New campaigns get a date the first time a sync sees YAMM merge them.
        </section>
      ) : (
        <CampaignTable rows={rows} />
      )}
      {rows.length > 0 && undated.length > 0 && <div style={{ height: 16 }} />}
      {undated.length > 0 && (
        <>
          <div className="page-head" style={{ marginBottom: 10 }}>
            <h2 className="display" style={{ fontSize: 20 }}>No date recorded</h2>
          </div>
          <CampaignTable rows={undated} />
        </>
      )}
    </>
  );
}
