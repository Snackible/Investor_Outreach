import "server-only";
import type { AnyBulkWriteOperation } from "mongodb";
import { assertRoomToWrite, db } from "./mongo";
import { STATUS_RANK, statusesFromSheets, type HubData, type Status } from "./data";
import { emailsIn } from "./emails";

/** One document per cleaned email. This is the only thing the hub stores. */
export type EmailDoc = {
  _id: string;
  s: Status;
  by: string;
  at: Date;
  src?: string;
  /** Source spreadsheet: t = Investor Tracker, d = Master Investor Database, l = Master Investor Sheet. */
  f?: "t" | "d" | "l";
  up?: string;
  bf?: boolean;
};

const FILE_CODE = { tracker: "t", database: "d", leads: "l" } as const;

const COLLECTION = "emails";

async function col() {
  return (await db()).collection<EmailDoc>(COLLECTION);
}

let snapshot: { at: number; map: Map<string, EmailDoc> } | null = null;

/** The whole hashmap in memory: about 6 MB even at 200,000 emails. Cached one minute. */
export async function hashmap(fresh = false): Promise<Map<string, EmailDoc>> {
  if (!fresh && snapshot && Date.now() - snapshot.at < 60 * 1000) return snapshot.map;
  const docs = await (await col()).find({}).toArray();
  const map = new Map(docs.map((d) => [d._id, d]));
  snapshot = { at: Date.now(), map };
  return map;
}

let lastSync: { at: number; result: SyncResult } | null = null;
let syncing: Promise<SyncResult> | null = null;

export type SyncResult = { inserted: number; upgraded: number; promoted: number; backfill: boolean; at: Date };

export function lastSyncResult() {
  return lastSync?.result ?? null;
}

/**
 * Brings the hashmap in line with the sheets. Statuses only ever move up
 * (staged → contacted → unsubscribed → bounced → do not contact), never down.
 * A staged email seen merged by YAMM is promoted and counted as contacted now.
 */
export async function syncHashmap(data: HubData, opts: { ifOlderThanMs?: number } = {}): Promise<SyncResult> {
  if (opts.ifOlderThanMs && lastSync && Date.now() - lastSync.at < opts.ifOlderThanMs) return lastSync.result;
  if (syncing) return syncing;
  syncing = (async () => {
    const current = await hashmap(true);
    const wanted = statusesFromSheets(data);
    // The first time a spreadsheet becomes readable, everything already in it is history, not this week's work.
    const knownFiles = new Set([...current.values()].filter((d) => d.s !== "staged" && d.f).map((d) => d.f));
    const now = new Date();
    const ops: AnyBulkWriteOperation<EmailDoc>[] = [];
    let inserted = 0, upgraded = 0, promoted = 0, history = 0;

    for (const [email, w] of wanted) {
      const cur = current.get(email);
      const f = FILE_CODE[w.file];
      if (!cur) {
        const bf = !knownFiles.has(f);
        ops.push({ insertOne: { document: { _id: email, s: w.status, by: w.owner, at: now, src: w.tab, f, ...(bf ? { bf: true } : {}) } } });
        inserted++;
        if (bf) history++;
      } else if (STATUS_RANK[w.status] > STATUS_RANK[cur.s]) {
        const fromStaged = cur.s === "staged";
        ops.push({
          updateOne: {
            filter: { _id: email, s: cur.s },
            update: { $set: { s: w.status, src: w.tab, f, ...(fromStaged ? { at: now, by: w.owner } : {}) }, $unset: fromStaged ? { bf: "" } : {} },
          },
        });
        if (fromStaged) promoted++;
        else upgraded++;
      }
    }
    if (ops.length) {
      await assertRoomToWrite();
      const c = await col();
      for (let i = 0; i < ops.length; i += 2000) await c.bulkWrite(ops.slice(i, i + 2000), { ordered: false });
      snapshot = null;
    }
    const result = { inserted, upgraded, promoted, backfill: history > 0, at: now };
    lastSync = { at: Date.now(), result };
    return result;
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

export type Contacted = { total: number; byDay: Map<string, number>; byOwner: { owner: string; n: number }[] };

/** Emails first merged within [from, to), by day and by owner. History loaded at first sync is excluded. */
export async function contactedIn(from: Date | null, to: Date | null): Promise<Contacted> {
  const byDay = new Map<string, number>();
  const owners = new Map<string, number>();
  let total = 0;
  for (const d of (await hashmap()).values()) {
    if (d.bf || d.s === "staged" || d.s === "do_not_contact") continue;
    if ((from && d.at < from) || (to && d.at >= to)) continue;
    total++;
    const k = `${d.at.getFullYear()}-${String(d.at.getMonth() + 1).padStart(2, "0")}-${String(d.at.getDate()).padStart(2, "0")}`;
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
    owners.set(d.by, (owners.get(d.by) ?? 0) + 1);
  }
  return { total, byDay, byOwner: [...owners].map(([owner, n]) => ({ owner, n })).sort((a, b) => b.n - a.n) };
}

/** The first time the hub saw each tab's emails merged (tabs only ever seen as history have no date). */
export async function tabFirstMerged(): Promise<Map<string, Date>> {
  const out = new Map<string, Date>();
  for (const d of (await hashmap()).values()) {
    if (d.bf || !d.src || d.s === "staged") continue;
    const cur = out.get(d.src);
    if (!cur || d.at < cur) out.set(d.src, d.at);
  }
  return out;
}

/** When counting began: the earliest history (backfill) entry. */
export async function trackingStarted(): Promise<Date | null> {
  let first: Date | null = null;
  for (const d of (await hashmap()).values()) if (d.bf && (!first || d.at < first)) first = d.at;
  return first;
}

export type CheckRow = {
  email: string;
  result: "new" | "contacted" | "do_not_contact" | "bounced" | "unsubscribed" | "staged" | "duplicate_in_list";
  detail: string;
  sameFirm?: string;
};

/** Checks a pasted list against the hashmap. Nothing is written. */
export async function checkEmails(raw: string, data: HubData): Promise<{ rows: CheckRow[]; invalid: number }> {
  const map = await hashmap();
  const seen = new Set<string>();
  const firms = new Map<string, string>();
  for (const [email, d] of map) if (d.s !== "staged") firms.set(email.split("@")[1], email);
  const rows: CheckRow[] = [];
  let invalid = 0;
  for (const line of raw.split(/\r?\n|;/)) {
    if (!line.trim()) continue;
    const found = emailsIn(line);
    if (found.length === 0) {
      if (/[a-z]/i.test(line) && !/e-?mail|name/i.test(line)) invalid++;
      continue;
    }
    for (const email of found) {
      if (seen.has(email)) {
        rows.push({ email, result: "duplicate_in_list", detail: "Appears earlier in this list" });
        continue;
      }
      seen.add(email);
      const d = map.get(email);
      const dnc = data.dnc.has(email);
      if (dnc || d?.s === "do_not_contact") rows.push({ email, result: "do_not_contact", detail: "On the Exhausted list" });
      else if (d && d.s !== "staged") rows.push({ email, result: d.s, detail: `${d.src ?? "Sheets"} · ${d.by}` });
      else if (d?.s === "staged") rows.push({ email, result: "staged", detail: `Staged by ${d.by}, ${d.at.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}${d.up ? ` · ${d.up}` : ""}` });
      else {
        const domain = email.split("@")[1];
        const firm = firms.get(domain);
        rows.push({ email, result: "new", detail: "Not in the hashmap", ...(firm && !/gmail|yahoo|hotmail|outlook|rediff/.test(domain) ? { sameFirm: firm } : {}) });
      }
    }
  }
  return { rows, invalid };
}

/** Saves new emails as staged: kept, but not counted as used until YAMM merges them. */
export async function stageEmails(emails: string[], by: string): Promise<{ staged: number; uploadId: string }> {
  await assertRoomToWrite();
  const now = new Date();
  const uploadId = `UPL-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const ops = emails.map((email) => ({
    updateOne: { filter: { _id: email }, update: { $setOnInsert: { s: "staged" as const, by, at: now, up: uploadId } }, upsert: true },
  }));
  const res = ops.length ? await (await col()).bulkWrite(ops, { ordered: false }) : null;
  snapshot = null;
  return { staged: res?.upsertedCount ?? 0, uploadId };
}

export async function stagedEmails(): Promise<EmailDoc[]> {
  return [...(await hashmap()).values()].filter((d) => d.s === "staged").sort((a, b) => b.at.getTime() - a.at.getTime());
}

export async function counts() {
  const c: Record<Status, number> = { contacted: 0, do_not_contact: 0, bounced: 0, unsubscribed: 0, staged: 0 };
  const map = await hashmap();
  for (const d of map.values()) c[d.s]++;
  return { ...c, total: map.size };
}
