"use client";

import { FormEvent, useState } from "react";

export function SignInForm({ next = "/account/commerce" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Enter your account email. We will send a one-time sign-in link.");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const data = await response.json();
      setMessage(data.message || (response.ok ? "Check your email for the sign-in link." : "Unable to request sign-in."));
    } catch {
      setMessage("Unable to request sign-in right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-card" style={{ padding: 24, display: "grid", gap: 16, maxWidth: 620 }}>
      <label style={{ display: "grid", gap: 8 }}>
        <strong>Email address</strong>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <button className="button button-primary" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="form-message" role="status">{message}</p>
      <p style={{ color: "#5d7090", fontSize: 13, margin: 0 }}>
        Links expire after 15 minutes and can be used only once. AgentSiraji does not store a password for this sign-in method.
      </p>
    </form>
  );
}
