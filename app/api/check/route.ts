import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { loadHubData } from "@/lib/data";
import { readSpreadsheet, serviceAccountEmail, SheetAccessError, spreadsheetIdFrom } from "@/lib/google";
import { checkEmails } from "@/lib/hashmap";

/** Checks a list against the hashmap. Accepts pasted text, CSV text, or a Google Sheet tab. Writes nothing. */
export async function POST(req: Request) {
  if (!(await currentSession())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  let text = String(body.text ?? "");

  if (body.sheet) {
    const id = spreadsheetIdFrom(String(body.sheet));
    if (!id) return NextResponse.json({ error: "That doesn't look like a Google Sheets link." }, { status: 400 });
    try {
      const tabs = await readSpreadsheet(id, { fresh: true });
      const tab = body.tab ? tabs.find((t) => t.title.trim().toLowerCase() === String(body.tab).trim().toLowerCase()) : tabs[0];
      if (!tab) return NextResponse.json({ error: `No tab called "${body.tab}". Tabs in that sheet: ${tabs.map((t) => t.title).join(", ")}.` }, { status: 400 });
      text = tab.rows.map((r) => r.join(" ")).join("\n");
    } catch (err) {
      const e = err as SheetAccessError;
      const msg = e.status === 403 || e.status === 404 ? `The hub can't open that sheet. Share it as Viewer with ${serviceAccountEmail()} and try again.` : e.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
  if (!text.trim()) return NextResponse.json({ error: "Paste some emails first." }, { status: 400 });
  if (text.length > 5_000_000) return NextResponse.json({ error: "That list is over 5 MB. Split it into smaller lists." }, { status: 413 });

  try {
    const data = await loadHubData();
    return NextResponse.json(await checkEmails(text, data));
  } catch (err) {
    return NextResponse.json({ error: `The check couldn't run: ${(err as Error).message}` }, { status: 500 });
  }
}
