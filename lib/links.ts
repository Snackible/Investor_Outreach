import type { SourceFile } from "./data";

/** An investor page: by email when known, otherwise by their tracker row. */
export function contactHref(email?: string | null, pipelineKey?: string) {
  if (email) return `/contacts/${encodeURIComponent(email)}`;
  return `/contacts/${encodeURIComponent(`p~${pipelineKey}`)}`;
}

export function campaignHref(file: SourceFile, tab: string) {
  return `/campaigns/${file}/${encodeURIComponent(tab)}`;
}
