"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** The yellow plate on the Overview: paste, then hand the list to the Check page. */
export function QuickCheck() {
  const router = useRouter();
  const [text, setText] = useState("");
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          sessionStorage.setItem("hub_pending_check", text);
        } catch {}
        router.push("/check?run=1");
      }}
    >
      <div className="field">
        <label htmlFor="quick">Paste emails to check</label>
        <textarea id="quick" rows={3} style={{ minHeight: 84 }} placeholder="one per line, or a whole column copied from a sheet" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="plate">
        <p>Nothing is marked as used until YAMM merges it.</p>
        <button className="btn" type="submit" disabled={!text.trim()}>
          Check list
        </button>
      </div>
    </form>
  );
}
