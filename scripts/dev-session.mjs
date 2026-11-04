// Local testing only: prints a session cookie for a "Preview" admin, signed with this
// machine's SESSION_SECRET. It is useless anywhere the secret differs.
import { createHmac } from "node:crypto";
import { loadEnv } from "./load-env.mjs";

const env = loadEnv();
const payload = Buffer.from(JSON.stringify({ id: "preview", username: "preview", name: "Preview", exp: Date.now() + 2 * 3600 * 1000 })).toString("base64url");
const sig = createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
console.log(`${payload}.${sig}`);
