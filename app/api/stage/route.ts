import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { emailsIn } from "@/lib/emails";
import { stageEmails } from "@/lib/hashmap";
import { QuotaError } from "@/lib/mongo";

/** Saves new emails as staged. Existing hashmap entries are never touched. */
export async function POST(req: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const emails = [...new Set((Array.isArray(body.emails) ? body.emails : []).flatMap((e: unknown) => emailsIn(String(e))))] as string[];
  if (emails.length === 0) return NextResponse.json({ error: "No new emails to stage." }, { status: 400 });
  if (emails.length > 20000) return NextResponse.json({ error: "Stage at most 20,000 emails at a time." }, { status: 413 });
  try {
    return NextResponse.json(await stageEmails(emails, session.name));
  } catch (err) {
    const status = err instanceof QuotaError ? 507 : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
