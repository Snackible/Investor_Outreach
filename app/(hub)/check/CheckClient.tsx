"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Result = "new" | "contacted" | "do_not_contact" | "bounced" | "unsubscribed" | "staged" | "duplicate_in_list";
type Row = { email: string; result: Result; detail: string; sameFirm?: string };

const LABEL: Record<Result, string> = {
  new: "New",
  contacted: "Already contacted",
  do_not_contact: "Do not contact",
  bounced: "Bounced",
  unsubscribed: "Unsubscribed",
  staged: "Already staged",
  duplicate_in_list: "Repeated in list",
};
const ORDER: Result[] = ["new", "contacted", "do_not_contact", "bounced", "staged", "duplicate_in_list", "unsubscribed"];

type Source = "paste" | "csv" | "sheet";

export function CheckClient({ serviceAccount }: { serviceAccount: string }) {
  const router = useRouter();
  const [source, setSource] = useState<Source>("paste");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheet, setSheet] = useState("");
  const [tab, setTab] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [invalid, setInvalid] = useState(0);
  const [filter, setFilter] = useState<Result | "all">("all");
  const [staged, setStaged] = useState<{ n: number; id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const autoRan = useRef(false);

  async function run(payload?: { text?: string; sheet?: string; tab?: string }) {
    setBusy(true);
    setError(null);
    setStaged(null);
    const body = payload ?? (source === "sheet" ? { sheet, tab } : { text });
    const res = await fetch("/api/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({ error: "The check failed. Try again." }));
    setBusy(false);
    if (!res.ok) {
      setError(json.error);
      setRows(null);
      return;
    }
    setRows(json.rows);
    setInvalid(json.invalid);
    setFilter("all");
  }

  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem("hub_pending_check");
      sessionStorage.removeItem("hub_pending_check");
    } catch {}
    if (pending) {
      setText(pending);
      void run({ text: pending });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tally = useMemo(() => {
    const t = Object.fromEntries(ORDER.map((r) => [r, 0])) as Record<Result, number>;
    rows?.forEach((r) => t[r.result]++);
    return t;
  }, [rows]);
  const fresh = rows?.filter((r) => r.result === "new").map((r) => r.email) ?? [];
  const shown = rows?.filter((r) => filter === "all" || r.result === filter) ?? [];

  async function stage() {
    setBusy(true);
    const res = await fetch("/api/stage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ emails: fresh }) });
    const json = await res.json().catch(() => ({ error: "Staging failed." }));
    setBusy(false);
    if (!res.ok) return setError(json.error);
    setStaged({ n: json.staged, id: json.uploadId });
    setRows((rs) => rs?.map((r) => (r.result === "new" ? { ...r, result: "staged", detail: `Staged just now · ${json.uploadId}` } : r)) ?? null);
    router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(fresh.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob(["email\n" + fresh.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `clean-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="filters" role="group" aria-label="Where the list comes from">
          {(["paste", "csv", "sheet"] as Source[]).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={source === s} onClick={() => setSource(s)}>
              {s === "paste" ? "Paste" : s === "csv" ? "CSV file" : "Google Sheet tab"}
            </button>
          ))}
        </div>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          {source === "paste" && (
            <div className="field">
              <label htmlFor="paste">Emails</label>
              <textarea id="paste" value={text} onChange={(e) => setText(e.target.value)} placeholder="One per line, or paste a whole column or table copied from a sheet. Emails are found wherever they are." />
            </div>
          )}
          {source === "csv" && (
            <div className="field">
              <label htmlFor="csv">CSV or text file</label>
              <input
                id="csv"
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setFileName(f.name);
                  setText(await f.text());
                }}
              />
              {fileName && <span className="muted">{fileName} loaded. Every email in the file will be checked.</span>}
            </div>
          )}
          {source === "sheet" && (
            <div className="sheet-fields">
              <div className="field">
                <label htmlFor="sheet">Google Sheet link</label>
                <input id="sheet" value={sheet} onChange={(e) => setSheet(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" />
              </div>
              <div className="field">
                <label htmlFor="tab">Tab name</label>
                <input id="tab" value={tab} onChange={(e) => setTab(e.target.value)} placeholder="first tab if empty" />
              </div>
              <span className="muted" style={{ gridColumn: "1 / -1" }}>
                The sheet must be shared as Viewer with {serviceAccount}.
              </span>
            </div>
          )}
          <div className="plate">
            <p>Nothing is saved unless you stage it.</p>
            <button className="btn" type="submit" disabled={busy || (source === "sheet" ? !sheet.trim() : !text.trim())}>
              {busy ? "Checking…" : "Check list"}
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>

      {rows && (
        <>
          <section className="tally" aria-label="List scorecard">
            <div>
              <small>New</small>
              <b>{tally.new}</b>
            </div>
            <div>
              <small>Already contacted</small>
              <b>{tally.contacted}</b>
            </div>
            <div>
              <small>Do not contact</small>
              <b>{tally.do_not_contact}</b>
            </div>
            <div>
              <small>Bounced / unsub</small>
              <b>{tally.bounced + tally.unsubscribed}</b>
            </div>
            <div>
              <small>Already staged</small>
              <b>{tally.staged}</b>
            </div>
            <div>
              <small>Repeated in list</small>
              <b>{tally.duplicate_in_list}</b>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{fresh.length} new of {rows.length}</h2>
              <span>
                {invalid ? `${invalid} lines had no email and were skipped` : "Every line had an email"}
              </span>
            </div>
            <div className="filters">
              <button type="button" className="btn btn-action" onClick={stage} disabled={busy || fresh.length === 0}>
                Stage {fresh.length} new
              </button>
              <button type="button" className="btn btn-line" onClick={copy} disabled={fresh.length === 0}>
                {copied ? "Copied" : "Copy new emails"}
              </button>
              <button type="button" className="btn btn-line" onClick={download} disabled={fresh.length === 0}>
                Download clean CSV
              </button>
              {staged && (
                <span className="ok" role="status">
                  Saved {staged.n} as staged · {staged.id}. They stay unused until YAMM merges them.
                </span>
              )}
            </div>
            <div className="filters" role="group" aria-label="Filter results">
              <button type="button" className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
                All<b>{rows.length}</b>
              </button>
              {ORDER.filter((r) => tally[r] > 0).map((r) => (
                <button key={r} type="button" className="chip" aria-pressed={filter === r} onClick={() => setFilter(r)}>
                  {LABEL[r]}
                  <b>{tally[r]}</b>
                </button>
              ))}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Result</th>
                    <th>Where it was seen</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.slice(0, 500).map((r) => (
                    <tr key={r.email + r.result}>
                      <td>
                        {r.result === "new" || r.result === "duplicate_in_list" ? (
                          r.email
                        ) : (
                          <a href={`/contacts/${encodeURIComponent(r.email)}`} target="_blank" rel="noopener" title="Opens in a new tab so these results stay here">
                            {r.email}
                          </a>
                        )}
                      </td>
                      <td>
                        <span className={`badge b-${r.result}`}>{LABEL[r.result]}</span>
                      </td>
                      <td>
                        {r.detail}
                        {r.sameFirm && <span className="sub">Same firm already contacted: {r.sameFirm}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shown.length > 500 && <p className="panel-foot">Showing the first 500 of {shown.length}. Copy or download to get them all.</p>}
          </section>
        </>
      )}
    </div>
  );
}
