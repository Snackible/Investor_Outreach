"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });
    const body = await res.json().catch(() => ({ ok: false, error: "Sign-in failed. Try again." }));
    if (body.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setBusy(false);
      setPin("");
      setError(body.error);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <h1>Sign in</h1>
      <p className="muted">Admin accounts only. Use the username and 4-digit PIN from the team&apos;s logins sheet.</p>
      <div className="field">
        <label htmlFor="username">Username</label>
        <input id="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="pin">PIN</label>
        <input
          id="pin"
          className="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="\d{4}"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          aria-describedby={error ? "login-error" : undefined}
          required
        />
      </div>
      {error && (
        <p className="error" id="login-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-action" type="submit" disabled={busy || !username || pin.length !== 4}>
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
