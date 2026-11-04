import { NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const result = await login(String(body.username ?? ""), String(body.pin ?? ""));
    return NextResponse.json(result, { status: result.ok ? 200 : 401 });
  } catch (err) {
    console.error("login failed", err);
    return NextResponse.json({ ok: false, error: "Sign-in is unavailable right now: the users sheet or the database couldn't be reached." }, { status: 503 });
  }
}
