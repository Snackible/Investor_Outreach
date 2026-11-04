import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { loadHubData } from "@/lib/data";
import { clearSheetCache } from "@/lib/google";
import { syncHashmap } from "@/lib/hashmap";

export async function POST() {
  if (!(await currentSession())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  try {
    clearSheetCache();
    const data = await loadHubData({ fresh: true });
    const result = await syncHashmap(data);
    return NextResponse.json({ ...result, problems: data.problems.map((p) => p.file) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
