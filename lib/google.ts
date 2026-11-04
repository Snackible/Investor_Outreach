import "server-only";
import { JWT } from "google-auth-library";
import { env } from "./env";

let client: JWT | null = null;

function auth(): JWT {
  client ??= new JWT({
    email: env.serviceAccountEmail(),
    key: env.privateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return client;
}

export function serviceAccountEmail(): string | null {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null;
}

export class SheetAccessError extends Error {
  constructor(public spreadsheetId: string, public status: number | undefined, message: string) {
    super(message);
  }
}

export type Tab = { title: string; rows: string[][] };

const cache = new Map<string, { at: number; tabs: Tab[] }>();
const TTL_MS = 5 * 60 * 1000;

function quoteTab(title: string) {
  return `'${title.replace(/'/g, "''")}'`;
}

/** Reads every tab of a spreadsheet as a grid of strings. Cached for five minutes. */
export async function readSpreadsheet(spreadsheetId: string, opts: { fresh?: boolean; onlyTabs?: string[]; onlySheetIds?: number[] } = {}): Promise<Tab[]> {
  const cacheKey = spreadsheetId + (opts.onlyTabs ? "|" + opts.onlyTabs.join(",") : "") + (opts.onlySheetIds ? "#" + opts.onlySheetIds.join(",") : "");
  const hit = cache.get(cacheKey);
  if (hit && !opts.fresh && Date.now() - hit.at < TTL_MS) return hit.tabs;

  try {
    const meta = await auth().request<{ sheets: { properties: { title: string; sheetId: number } }[] }>({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(title,sheetId)`,
    });
    let titles = meta.data.sheets.filter((s) => !opts.onlySheetIds || opts.onlySheetIds.includes(s.properties.sheetId)).map((s) => s.properties.title);
    if (opts.onlyTabs) titles = titles.filter((t) => opts.onlyTabs!.includes(t));
    if (titles.length === 0) return [];

    const params = new URLSearchParams({ valueRenderOption: "FORMATTED_VALUE", majorDimension: "ROWS" });
    for (const t of titles) params.append("ranges", quoteTab(t));
    const res = await auth().request<{ valueRanges: { values?: string[][] }[] }>({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params}`,
    });
    const tabs = titles.map((title, i) => ({ title, rows: res.data.valueRanges[i]?.values ?? [] }));
    cache.set(cacheKey, { at: Date.now(), tabs });
    return tabs;
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };
    throw new SheetAccessError(spreadsheetId, e.response?.status, e.response?.data?.error?.message ?? e.message ?? "Sheets request failed");
  }
}

/** Pulls a spreadsheet id out of a pasted Google Sheets URL, or returns the input if it already is one. */
export function spreadsheetIdFrom(input: string): string | null {
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  return /^[a-zA-Z0-9-_]{30,}$/.test(input.trim()) ? input.trim() : null;
}

export function clearSheetCache() {
  cache.clear();
}
