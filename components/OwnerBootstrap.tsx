"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionPayload = {
  authenticated?: boolean;
  session?: { email: string; displayName: string | null; platformRoles: string[] } | null;
};

export function OwnerBootstrap() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [legacyToken, setLegacyToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    setSession(await response.json());
  }

  useEffect(() => { void refresh(); }, []);

  const roles = session?.session?.platformRoles || [];
  const isAdmin = roles.includes("PLATFORM_OWNER") || roles.includes("PLATFORM_ADMIN");

  async function bootstrap() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/bootstrap-owner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ legacyAdminToken: legacyToken }),
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "Owner bootstrap failed.");
      setLegacyToken(""); setMessage(data.message || "Platform owner established.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Owner bootstrap failed.");
    } finally { setBusy(false); }
  }

  if (!session) return <section className="glass-card" style={{ padding: 20 }}><p>Checking owner session…</p></section>;
  if (!session.authenticated) return <section className="glass-card" style={{ padding: 20 }}><h3>Owner sign-in required</h3><p>Sign in with the email attached to the existing AgentSiraji account before opening operations.</p><Link className="button button-primary" href="/sign-in?next=/admin">Sign in →</Link></section>;
  if (isAdmin) return <section className="glass-card" style={{ padding: 20 }}><h3>Platform admin session active</h3><p>{session.session?.displayName || session.session?.email} · {roles.join(", ")}</p></section>;

  return <section className="glass-card" style={{ padding: 20, display: "grid", gap: 12 }}>
    <h3>One-time owner migration</h3>
    <p>Your email session is verified. To establish the first platform owner, prove possession of the existing legacy admin token once. This bootstrap closes after the first owner is created.</p>
    <input type="password" autoComplete="off" value={legacyToken} onChange={event => setLegacyToken(event.target.value)} placeholder="Existing admin token" />
    <button className="button button-primary" type="button" disabled={busy || legacyToken.trim().length < 32} onClick={bootstrap}>{busy ? "Verifying…" : "Establish platform owner →"}</button>
    {message ? <p role="status">{message}</p> : null}
  </section>;
}
