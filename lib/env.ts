import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. Add it to .env.`);
  return value;
}

export const env = {
  mongoUri: () => required("MONGODB_URI"),
  mongoDb: () => process.env.MONGODB_DB || "investor_hub",
  mongoCeilingMb: () => Number(process.env.MONGODB_CEILING_MB || 450),
  serviceAccountEmail: () => required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  /** Hosts often store the key with literal "\n" sequences; turn them back into newlines. */
  privateKey: () => required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  sheets: () => ({
    tracker: required("SHEET_TRACKER_ID"),
    database: required("SHEET_DATABASE_ID"),
    leads: required("SHEET_LEADS_ID"),
    users: required("SHEET_USERS_ID"),
  }),
  /** Tab ids (the gid in a sheet link) to read from the Investor Tracker; empty means every tab. */
  trackerTabIds: () =>
    (process.env.SHEET_TRACKER_TAB_IDS ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x))
      .map(Number),
  sessionSecret: () => required("SESSION_SECRET"),
};
