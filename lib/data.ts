import "server-only";
import { env } from "./env";
import { readSpreadsheet, SheetAccessError, type Tab } from "./google";
import { emailsIn } from "./emails";
import { cell, CLOSED_STAGES, detectColumns, ownerFromCell, ownerFromTab, parseDate, toStage, type Stage } from "./parse";

export type SourceFile = "tracker" | "database" | "leads";

export const FILE_LABEL: Record<SourceFile, string> = {
  tracker: "Investor Tracker",
  database: "Master Investor Database",
  leads: "Master Investor Sheet",
};

export type Sighting = {
  email: string;
  name: string;
  org: string;
  file: SourceFile;
  tab: string;
  row: number;
  owner: string;
  merge: string;
  prevMerge: string;
};

export type Campaign = {
  file: SourceFile;
  tab: string;
  owner: string;
  listed: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
};

export type PipelineEntry = {
  key: string;
  name: string;
  org: string;
  email: string;
  tab: string;
  owner: string;
  stage: Stage | null;
  rawStage: string;
  last: Date | null;
  next: Date | null;
  nextRaw: string;
  remarks: string;
};

export type LoadProblem = { file: SourceFile | "users"; status?: number; message: string };

export type HubData = {
  sightings: Sighting[];
  campaigns: Campaign[];
  pipeline: PipelineEntry[];
  dnc: Set<string>;
  problems: LoadProblem[];
  loadedAt: Date;
};

const YAMM_SENT = /EMAIL_(SENT|OPENED|CLICKED)|RESPONDED|BOUNCED|UNSUBSCRIBED|ERROR/i;
const SKIP_TABS = /^\s*check\s*$|^master search$|^communities$|^listed companies|^data requirements$|dashboard/i;

function sightingsFrom(file: SourceFile, tab: Tab): { sightings: Sighting[]; campaign: Campaign | null } {
  const cols = detectColumns(tab.rows);
  if (!cols) return { sightings: [], campaign: null };
  const tabOwner = ownerFromTab(tab.title);
  const sightings: Sighting[] = [];
  const campaign: Campaign | null =
    cols.merge >= 0 ? { file, tab: tab.title, owner: tabOwner, listed: 0, sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, unsubscribed: 0 } : null;

  for (let r = cols.header + 1; r < tab.rows.length; r++) {
    const row = tab.rows[r];
    const emails = emailsIn(cell(row, cols.email));
    if (emails.length === 0) continue;
    const merge = cell(row, cols.merge).toUpperCase();
    const name =
      cell(row, cols.name) || [cell(row, cols.firstName), cell(row, cols.lastName)].filter(Boolean).join(" ") || cell(row, 0);
    const owner = ownerFromCell(cell(row, cols.owner), tabOwner);
    for (const email of emails) {
      sightings.push({ email, name, org: cell(row, cols.org), file, tab: tab.title, row: r + 1, owner, merge, prevMerge: cell(row, cols.prevMerge).toUpperCase() });
    }
    if (campaign) {
      campaign.listed++;
      if (YAMM_SENT.test(merge)) {
        campaign.sent++;
        if (/OPENED|CLICKED|RESPONDED/.test(merge)) campaign.opened++;
        if (/CLICKED/.test(merge)) campaign.clicked++;
        if (/RESPONDED/.test(merge)) campaign.replied++;
        if (/BOUNCED/.test(merge)) campaign.bounced++;
        if (/UNSUBSCRIBED/.test(merge)) campaign.unsubscribed++;
      }
    }
  }
  return { sightings, campaign: campaign && campaign.sent > 0 ? campaign : null };
}

/** Reads the person-by-person tracker tabs into one pipeline, by header names. */
function pipelineFrom(tab: Tab, now: Date): PipelineEntry[] {
  const rows = tab.rows;
  let header = -1;
  for (let r = 0; r < Math.min(6, rows.length); r++) {
    const h = rows[r].map((c) => c.toLowerCase().trim());
    if (h.some((c) => /^(phase|status)/.test(c)) && h.some((c) => /mail|company|organi|linkedin/.test(c))) {
      header = r;
      break;
    }
  }
  if (header === -1) return [];
  const h = rows[header].map((c) => c.toLowerCase().trim());
  const idx = (re: RegExp) => h.findIndex((c) => re.test(c));
  let nameCol = idx(/^name|^first name/);
  if (nameCol === -1 && !h[0]) nameCol = 0;
  const firstCol = idx(/^first name/);
  const lastNameCol = idx(/^last name|^surname/);
  const orgCol = idx(/^company|^organi|^present organi/);
  const emailCol = idx(/mail id|^e-?mail/);
  const lastCol = idx(/^last (mailed|follow)/);
  const nextCol = idx(/^to be mailed|^to follow up/);
  const ownerCol = idx(/^poc$/);
  const remarksCol = idx(/^remarks|^updates/);

  // Several tabs carry two status columns: long notes and a short category. Use the short one.
  const stageCols = h.map((c, i) => (/^(phase|status)\b/.test(c) && !/^phases$/.test(c) ? i : -1)).filter((i) => i >= 0);
  const avgLen = (c: number) => {
    const vals = rows.slice(header + 1).map((r) => cell(r, c)).filter(Boolean);
    return vals.length ? vals.reduce((a, v) => a + v.length, 0) / vals.length : 999;
  };
  const stageCol = stageCols.sort((a, b) => avgLen(a) - avgLen(b))[0] ?? -1;
  const notesCol = stageCols.find((c) => c !== stageCol) ?? remarksCol;

  const tabOwner = ownerFromTab(tab.title);
  const out: PipelineEntry[] = [];
  for (let r = header + 1; r < rows.length; r++) {
    const row = rows[r];
    const name = (cell(row, nameCol) || [cell(row, firstCol), cell(row, lastNameCol)].filter(Boolean).join(" ")).replace(/\s+/g, " ");
    if (!name || name.length > 60) continue;
    const rawStage = cell(row, stageCol);
    const nextRaw = cell(row, nextCol);
    const email = emailsIn(cell(row, emailCol))[0] ?? "";
    out.push({
      key: `${tab.title}:${r + 1}`,
      name,
      org: cell(row, orgCol),
      email,
      tab: tab.title,
      owner: ownerFromCell(cell(row, ownerCol), tabOwner),
      stage: toStage(rawStage) ?? toStage(cell(row, notesCol)),
      rawStage,
      last: parseDate(cell(row, lastCol), now),
      next: /^(no|no more|as)$/i.test(nextRaw) ? null : parseDate(nextRaw, now),
      nextRaw,
      remarks: cell(row, notesCol === stageCol ? remarksCol : notesCol).slice(0, 280),
    });
  }
  return out;
}

let inflight: Promise<HubData> | null = null;
let last: { at: number; data: HubData } | null = null;

/** Loads all three investor sheets. Shares one in-flight read and keeps the result for two minutes. */
export async function loadHubData(opts: { fresh?: boolean } = {}): Promise<HubData> {
  if (!opts.fresh && last && Date.now() - last.at < 2 * 60 * 1000) return last.data;
  if (inflight) return inflight;
  inflight = (async () => {
    const ids = env.sheets();
    const now = new Date();
    const problems: LoadProblem[] = [];
    const trackerTabs = env.trackerTabIds();
    const read = async (file: SourceFile, id: string) => {
      try {
        return await readSpreadsheet(id, { fresh: opts.fresh, ...(file === "tracker" && trackerTabs.length ? { onlySheetIds: trackerTabs } : {}) });
      } catch (err) {
        const e = err as SheetAccessError;
        problems.push({ file, status: e.status, message: e.message });
        return [] as Tab[];
      }
    };
    const [tracker, database, leads] = await Promise.all([read("tracker", ids.tracker), read("database", ids.database), read("leads", ids.leads)]);

    const sightings: Sighting[] = [];
    const campaigns: Campaign[] = [];
    const dnc = new Set<string>();
    const pipeline: PipelineEntry[] = [];

    for (const [file, tabs] of [["tracker", tracker], ["database", database], ["leads", leads]] as const) {
      for (const tab of tabs) {
        if (SKIP_TABS.test(tab.title)) continue;
        const { sightings: s, campaign } = sightingsFrom(file, tab);
        if (file === "database" && /exhausted/i.test(tab.title)) s.forEach((x) => dnc.add(x.email));
        sightings.push(...s);
        if (campaign) campaigns.push(campaign);
        if (file === "tracker") pipeline.push(...pipelineFrom(tab, now));
      }
    }
    const data: HubData = { sightings, campaigns, pipeline, dnc, problems, loadedAt: now };
    last = { at: Date.now(), data };
    return data;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export type Status = "contacted" | "do_not_contact" | "bounced" | "unsubscribed" | "staged";

export const STATUS_RANK: Record<Status, number> = { staged: 0, contacted: 1, unsubscribed: 2, bounced: 3, do_not_contact: 4 };

/** The hashmap status each email has earned from the sheets alone (staged comes only from uploads). */
export type SheetStatus = { status: Exclude<Status, "staged">; owner: string; tab: string; file: SourceFile };

export function statusesFromSheets(data: HubData): Map<string, SheetStatus> {
  const out = new Map<string, SheetStatus>();
  const put = (s: Sighting, status: SheetStatus["status"]) => {
    const cur = out.get(s.email);
    if (!cur || STATUS_RANK[status] > STATUS_RANK[cur.status]) out.set(s.email, { status, owner: s.owner, tab: s.tab, file: s.file });
  };
  for (const s of data.sightings) {
    if (data.dnc.has(s.email)) put(s, "do_not_contact");
    else if (/BOUNCED/.test(s.merge)) put(s, "bounced");
    else if (/UNSUBSCRIBED/.test(s.merge)) put(s, "unsubscribed");
    else if (YAMM_SENT.test(s.merge) || s.file === "tracker") put(s, "contacted");
  }
  return out;
}

export function isOpen(e: PipelineEntry) {
  return !e.stage || !CLOSED_STAGES.includes(e.stage);
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

export type FollowUps = { due: (PipelineEntry & { late: number })[]; stale: number; dueToday: number; overdue: number };

/** Open investors whose next follow-up is today or up to 30 days late; older ones count as stale. */
export function followUps(data: HubData, now = new Date()): FollowUps {
  const due: (PipelineEntry & { late: number })[] = [];
  let stale = 0;
  for (const e of data.pipeline) {
    if (!isOpen(e) || !e.next) continue;
    const late = daysBetween(now, e.next);
    if (late < 0) continue;
    if (late > 30) {
      stale++;
      continue;
    }
    due.push({ ...e, late });
  }
  due.sort((a, b) => b.late - a.late || a.name.localeCompare(b.name));
  return { due, stale, dueToday: due.filter((d) => d.late === 0).length, overdue: due.filter((d) => d.late > 0).length };
}
