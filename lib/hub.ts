import "server-only";
import { cache } from "react";
import { followUps, loadHubData, type FollowUps, type HubData, type LoadProblem } from "./data";
import { contactedIn, counts, lastSyncFailure, lastSyncResult, syncHashmap, type SyncResult } from "./hashmap";
import { QuotaError } from "./mongo";
import { readRange } from "./range";

export type HubContext = {
  data: HubData;
  counts: Awaited<ReturnType<typeof counts>> | null;
  sync: SyncResult | null;
  problems: (LoadProblem | { file: "hashmap"; message: string })[];
  replyRate: number | null;
  weekNumber: number;
  bug: { thisWeek: number; today: number; lastWeek: number };
  followUps: FollowUps;
};

function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Everything a hub page needs, loaded once per request. The hashmap syncs at most every 15 minutes. */
export const hubContext = cache(async (): Promise<HubContext> => {
  const data = await loadHubData();
  const problems: HubContext["problems"] = [...data.problems];
  let sync: SyncResult | null = null;
  let c: HubContext["counts"] = null;
  const bug = { thisWeek: 0, today: 0, lastWeek: 0 };
  const syncing = syncHashmap(data, { ifOlderThanMs: 15 * 60 * 1000 });
  if (lastSyncResult()) {
    // Already synced once: never make a click wait. A failure shows on the next page load.
    sync = lastSyncResult();
    syncing.catch(() => {});
    const failure = lastSyncFailure();
    if (failure) problems.push({ file: "hashmap", message: failure });
  } else {
    try {
      sync = await syncing;
    } catch (err) {
      problems.push({ file: "hashmap", message: err instanceof QuotaError ? err.message : `Couldn't update the database: ${(err as Error).message}` });
    }
  }
  try {
    const now = new Date();
    const week = readRange({ range: "this-week" }, "this-week", now);
    const last = readRange({ range: "last-week" }, "last-week", now);
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [w, l, t, cc] = await Promise.all([
      contactedIn(week.from, week.to),
      contactedIn(last.from, last.to),
      contactedIn(startToday, new Date(startToday.getTime() + 86400000)),
      counts(),
    ]);
    Object.assign(bug, { thisWeek: w.total, lastWeek: l.total, today: t.total });
    c = cc;
  } catch (err) {
    problems.push({ file: "hashmap", message: `Couldn't read the database: ${(err as Error).message}` });
  }
  const sent = data.campaigns.reduce((a, x) => a + x.sent, 0);
  const replied = data.campaigns.reduce((a, x) => a + x.replied, 0);
  return {
    data,
    counts: c,
    sync,
    problems,
    replyRate: sent ? (replied / sent) * 100 : null,
    weekNumber: isoWeek(new Date()),
    bug,
    followUps: followUps(data),
  };
});
