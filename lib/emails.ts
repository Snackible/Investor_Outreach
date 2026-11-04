const EMAIL_RE = /[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * Cleans one cell into zero or more email keys: lowercased, trimmed,
 * trailing punctuation stripped, multi-email cells split, placeholders dropped.
 */
export function emailsIn(cell: string | undefined | null): string[] {
  if (!cell) return [];
  const found = cell.match(EMAIL_RE);
  if (!found) return [];
  const out = new Set<string>();
  for (const raw of found) {
    const e = raw.toLowerCase().replace(/^[.'-]+|[.'-]+$/g, "");
    const [local, domain] = e.split("@");
    if (!local || !domain || domain.startsWith(".") || domain.includes("..")) continue;
    out.add(e);
  }
  return [...out];
}

export function domainOf(email: string): string {
  return email.slice(email.indexOf("@") + 1);
}

const FREE_MAIL = new Set(["gmail.com", "yahoo.com", "yahoo.co.in", "hotmail.com", "outlook.com", "rediffmail.com", "icloud.com", "live.com"]);

/** True when the domain identifies a firm, so a second contact there is worth flagging. */
export function isFirmDomain(domain: string): boolean {
  return !FREE_MAIL.has(domain);
}
