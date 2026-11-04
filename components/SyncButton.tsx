"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton({ lastSync }: { lastSync: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setState("busy");
    setMsg(null);
    const res = await fetch("/api/sync", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("error");
      setMsg(body.error ?? "Sync failed. Try again in a minute.");
      return;
    }
    setState("idle");
    setMsg(`Synced: ${body.inserted} new, ${body.promoted} promoted from staged, ${body.upgraded} status changes.`);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span className="muted" role="status">
        {msg ?? (lastSync ? `Sheets synced ${lastSync}` : "Not synced yet")}
      </span>
      <button className="btn btn-line" type="button" onClick={run} disabled={state === "busy"}>
        {state === "busy" ? "Syncing…" : "Sync now"}
      </button>
    </div>
  );
}
