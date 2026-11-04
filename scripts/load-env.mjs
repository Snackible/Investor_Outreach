// Reads the project's .env for the helper scripts (Next.js loads it itself for the app).
import { readFileSync } from "node:fs";

export function loadEnv() {
  const out = {};
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const key = line.slice(0, line.indexOf("="));
    let value = line.slice(line.indexOf("=") + 1);
    if (value.startsWith('"') && value.endsWith('"')) value = JSON.parse(value);
    out[key] = value;
  }
  return out;
}
