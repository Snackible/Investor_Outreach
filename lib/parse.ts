import { emailsIn } from "./emails";

export type Columns = {
  header: number;
  email: number;
  name: number;
  firstName: number;
  lastName: number;
  org: number;
  merge: number;
  prevMerge: number;
  last: number;
  next: number;
  stage: number;
  owner: number;
  remarks: number;
};

const norm = (s: string | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

function find(headers: string[], ...tests: RegExp[]): number {
  for (const t of tests) {
    const i = headers.findIndex((h) => t.test(h));
    if (i !== -1) return i;
  }
  return -1;
}

/**
 * Finds the header row and the columns that matter on any tab, by header text first
 * and by content second (the column whose cells most often hold an email).
 */
export function detectColumns(rows: string[][]): Columns | null {
  if (rows.length === 0) return null;
  let header = 0;
  let best = -1;
  for (let r = 0; r < Math.min(6, rows.length); r++) {
    const cells = rows[r].map(norm);
    const score = cells.filter((c) => /mail|name|company|organi|status|phase|fund|role|title/.test(c)).length;
    if (score > best) {
      best = score;
      header = r;
    }
  }
  const h = (rows[header] ?? []).map(norm);

  let email = find(h, /^e-?mail( id)?$/, /^mail( id)?$/, /e-?mail/, /mail id/, /^mail$/);
  const body = rows.slice(header + 1, header + 200);
  if (email === -1 || body.filter((r) => emailsIn(r[email]).length).length < body.length * 0.2) {
    const width = Math.max(...rows.slice(header, header + 50).map((r) => r.length), 0);
    let bestCol = -1;
    let bestHits = 0;
    for (let c = 0; c < width; c++) {
      const hits = body.filter((r) => emailsIn(r[c]).length).length;
      if (hits > bestHits) {
        bestHits = hits;
        bestCol = c;
      }
    }
    if (bestHits >= Math.max(1, body.length * 0.1)) email = bestCol;
  }
  if (email === -1) return null;

  return {
    header,
    email,
    name: find(h, /^name ?$/, /^investor( name)?/, /^poc$/, /^fund name/),
    firstName: find(h, /^first/, /^firs/),
    lastName: find(h, /^last name/, /^surname/, /^second/),
    org: find(h, /^company/, /^organi[sz]ation/, /^org/, /fund name/, /^firm/, /^present organi/, /^fund/),
    merge: find(h, /^merge status/, /^merg/),
    prevMerge: find(h, /^prev(ious)? merge/, /^prev/),
    last: find(h, /^last (mailed|follow)/, /^last contact/),
    next: find(h, /^to be mailed/, /^to follow up/, /^next/),
    stage: find(h, /^phase$/, /^status$/, /^status/, /^phase/),
    owner: find(h, /^poc$/, /^owner/),
    remarks: find(h, /^remarks/, /^updates/, /^comm/),
  };
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/** Parses the date styles found in the trackers: 17/02/2026, 1/12/25, 30 sept, 12th June, 2nd oct. */
export function parseDate(raw: string | undefined, now = new Date()): Date | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    const d = new Date(y, Number(m[2]) - 1, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?(?:\s+(\d{2,4}))?$/) ?? s.match(/^([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?$/);
  if (m) {
    const [day, mon] = /^\d/.test(m[1]) ? [Number(m[1]), m[2]] : [Number(m[2]), m[1]];
    const month = MONTHS[mon.slice(0, 4)] ?? MONTHS[mon.slice(0, 3)];
    if (month === undefined) return null;
    if (m[3]) return new Date(m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]), month, day);
    // No year written: take the year that puts the date nearest to today.
    const candidates = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => new Date(y, month, day));
    return candidates.sort((a, b) => Math.abs(a.getTime() - now.getTime()) - Math.abs(b.getTime() - now.getTime()))[0];
  }
  return null;
}

export const STAGES = [
  "Waiting for reply",
  "Follow-up pending",
  "Connected",
  "Meeting scheduled",
  "Meeting done",
  "Data to be sent",
  "Due diligence",
  "Interested",
  "On hold",
  "Converted",
  "Not interested",
  "Inactive",
  "Do not contact",
] as const;
export type Stage = (typeof STAGES)[number];

export const CLOSED_STAGES: Stage[] = ["Converted", "Not interested", "Inactive", "Do not contact"];

/** Maps the team's free-text phases onto one fixed stage list. */
export function toStage(raw: string | undefined): Stage | null {
  const s = norm(raw);
  if (!s) return null;
  if (/don'?t reach|do not contact|dnc/.test(s)) return "Do not contact";
  if (/not interest|negative|regret|not aligned|backed out|don'?t invest/.test(s)) return "Not interested";
  if (/inactive|transitioning/.test(s)) return "Inactive";
  if (/convert/.test(s)) return "Converted";
  if (/on hold|^hold/.test(s)) return "On hold";
  if (/due dilig|\bdd\b/.test(s)) return "Due diligence";
  if (/data (to be )?sent|data shared|send data|data to be|dataroom|share (the )?deck|financials/.test(s)) return "Data to be sent";
  if (/meet.*(done|held)|met /.test(s)) return "Meeting done";
  if (/meet|call/.test(s)) return "Meeting scheduled";
  if (/whatsapp|connected|linkedin/.test(s)) return "Connected";
  if (/follow ?up|pending from our side|chaser/.test(s)) return "Follow-up pending";
  if (/interest|want(s)? to know|in process/.test(s)) return "Interested";
  if (/waiting|awaited|will revert|no response|inmail sent|mailed/.test(s)) return "Waiting for reply";
  return null;
}

export const OWNERS = ["Aditi", "Stuti", "Saumya", "Heet", "Hitansh", "Chinmay", "Mihir", "Hanisha", "Faihan", "Shripad", "Bhoomika", "Arshika", "Siddharth"];

/** Works out who owns a tab from its name, e.g. "Chinmay reviewed (3)" or "Heet HNI P1". */
export function ownerFromTab(tab: string): string {
  const t = tab.toLowerCase();
  for (const o of OWNERS) if (t.includes(o.toLowerCase())) return o;
  if (/\bas\b/.test(t)) return "AS";
  return "Team";
}

export function ownerFromCell(cell: string | undefined, fallback: string): string {
  const c = (cell ?? "").trim();
  if (!c) return fallback;
  if (/^as$/i.test(c)) return "AS";
  const hit = OWNERS.find((o) => c.toLowerCase().startsWith(o.toLowerCase()));
  return hit ?? c;
}

export function cell(row: string[], i: number): string {
  return i >= 0 ? (row[i] ?? "").trim() : "";
}
