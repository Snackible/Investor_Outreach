// Checks that the service account can read every configured sheet.
// Prints tab names and row counts only, never cell values.
import { JWT } from "google-auth-library";
import { loadEnv } from "./load-env.mjs";

const env = loadEnv();

const key = { client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: env.GOOGLE_PRIVATE_KEY };
const auth = new JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = {
  tracker: env.SHEET_TRACKER_ID,
  database: env.SHEET_DATABASE_ID,
  leads: env.SHEET_LEADS_ID,
  users: env.SHEET_USERS_ID,
};

console.log(`Service account: ${key.client_email}\n`);
for (const [name, id] of Object.entries(sheets)) {
  try {
    const res = await auth.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=properties.title,sheets.properties(title,gridProperties.rowCount)`,
    });
    const tabs = res.data.sheets.map((s) => `${s.properties.title} (${s.properties.gridProperties.rowCount})`);
    console.log(`OK   ${name}: "${res.data.properties.title}", ${tabs.length} tabs`);
    if (name === "users") console.log(`     tabs: ${tabs.join(", ")}`);
  } catch (err) {
    const status = err.response?.status;
    console.log(`FAIL ${name}: ${status ?? ""} ${err.response?.data?.error?.message ?? err.message}`);
  }
}
