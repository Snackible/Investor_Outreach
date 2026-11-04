import "server-only";
/**
 * pinVault - verifies login PINs stored as salted scrypt hashes on the shared
 * Users sheet, falling back to plain-text comparison for rows not yet
 * upgraded by another dashboard on the same sheet.
 *
 * This app never writes PINs, so only verifyPin/isEncrypted are needed here.
 * Format must stay byte-for-byte compatible with OpsxB2B_Dashboard/server/lib/pinVault.js.
 */
import { scrypt, timingSafeEqual, createHmac, createHash } from "node:crypto";

const TAG = "scrypt1";
const TAG_PEPPERED = "scrypt1p";
const KEY_LEN = 32;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

function derive(secret: Buffer, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(secret, salt, KEY_LEN, SCRYPT_PARAMS, (err, key) => (err ? reject(err) : resolve(key as Buffer)));
  });
}

function pepper(): string {
  return process.env.PIN_PEPPER || "";
}

function applyPepper(pin: string, key: string): Buffer {
  return key ? createHmac("sha256", key).update(pin).digest() : Buffer.from(pin, "utf8");
}

/** True if the stored value is already one of ours (a hash), false for a plain-text PIN or blank. */
export function isEncrypted(stored: string | null | undefined): boolean {
  const s = String(stored ?? "");
  return s.startsWith(TAG + "$") || s.startsWith(TAG_PEPPERED + "$");
}

function safeEqualText(a: string, b: string): boolean {
  const da = createHash("sha256").update(String(a)).digest();
  const db = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(da, db);
}

/**
 * Does `typed` match what's stored? Works for hashes and for legacy plain-text
 * PINs, so it keeps working whether or not the row has been upgraded yet.
 */
export async function verifyPin(typed: string | null | undefined, stored: string | null | undefined): Promise<boolean> {
  const input = String(typed ?? "");
  const value = String(stored ?? "");
  if (!input || !value) return false;
  if (!isEncrypted(value)) return safeEqualText(input, value);

  const [tag, saltText, hashText] = value.split("$");
  if (!saltText || !hashText) return false;
  let key = "";
  if (tag === TAG_PEPPERED) {
    key = pepper();
    if (!key) throw new Error("This PIN was hashed with PIN_PEPPER, but PIN_PEPPER isn't set on this server");
  }
  const expected = Buffer.from(hashText, "base64url");
  const actual = await derive(applyPepper(input, key), Buffer.from(saltText, "base64url"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
