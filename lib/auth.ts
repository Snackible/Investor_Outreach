import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./env";
import { readSpreadsheet } from "./google";
import { db } from "./mongo";

export const SESSION_COOKIE = "hub_session";
const SESSION_HOURS = 12;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export type Session = { id: string; username: string; name: string; exp: number };

type UserRow = { username: string; pin: string; role: string; accountId: string; displayName: string };

/** Reads the users sheet on the server. Rows are never sent to the browser. */
async function users(): Promise<UserRow[]> {
  const [tab] = await readSpreadsheet(env.sheets().users, { fresh: true });
  if (!tab || tab.rows.length < 2) return [];
  const h = tab.rows[0].map((c) => c.toLowerCase().trim());
  const col = (name: string) => h.indexOf(name);
  const [u, p, r, a, d] = [col("username"), col("password"), col("role"), col("account_id"), col("display_name")];
  return tab.rows.slice(1).map((row) => ({
    username: (row[u] ?? "").trim(),
    pin: (row[p] ?? "").trim(),
    role: (row[r] ?? "").trim().toLowerCase(),
    accountId: (row[a] ?? "").trim(),
    displayName: (row[d] ?? "").trim(),
  }));
}

function sign(payload: string) {
  return createHmac("sha256", env.sessionSecret()).update(payload).digest("base64url");
}

function sameString(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

async function locks() {
  const c = (await db()).collection<{ _id: string; n: number; until?: Date; exp: Date }>("login_locks");
  await c.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  return c;
}

export type LoginResult = { ok: true } | { ok: false; error: string };

/** Admin-only sign-in with a 4-digit PIN. Five wrong attempts lock the username for 15 minutes. */
export async function login(usernameRaw: string, pin: string): Promise<LoginResult> {
  const username = usernameRaw.trim().toLowerCase();
  if (!username || !/^\d{4}$/.test(pin)) return { ok: false, error: "Enter your username and your 4-digit PIN." };

  const c = await locks();
  const lock = await c.findOne({ _id: username });
  if (lock?.until && lock.until > new Date()) {
    const mins = Math.ceil((lock.until.getTime() - Date.now()) / 60000);
    return { ok: false, error: `Too many wrong attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  const user = (await users()).find((x) => x.username.toLowerCase() === username);
  const valid = !!user && user.role === "admin" && sameString(user.pin, pin);
  if (!valid) {
    const n = (lock?.n ?? 0) + 1;
    const locked = n >= MAX_ATTEMPTS;
    await c.updateOne(
      { _id: username },
      { $set: { n: locked ? 0 : n, exp: new Date(Date.now() + 60 * 60 * 1000), ...(locked ? { until: new Date(Date.now() + LOCK_MINUTES * 60000) } : {}) } },
      { upsert: true }
    );
    return { ok: false, error: locked ? `Too many wrong attempts. Try again in ${LOCK_MINUTES} minutes.` : "That username and PIN don't match an admin account." };
  }

  await c.deleteOne({ _id: username });
  const session: Session = { id: user!.accountId || user!.username, username: user!.username, name: user!.displayName || user!.username, exp: Date.now() + SESSION_HOURS * 3600 * 1000 };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return { ok: true };
}

export async function currentSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !sameString(sign(payload), sig)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const s = await currentSession();
  if (!s) redirect("/login");
  return s;
}
