"use client";

import { useState } from "react";

type Health = { state: "missing" | "healthy" | "error" | "unverified"; detail: string };
type Status = { meta: { configured: boolean; pixelId: string; testMode: boolean }; google: { configured: boolean; measurementId: string }; leadPilot: { configured: boolean; endpoint: string } };

export function IntegrationSettings() {
  const [token, setToken] = useState("");
  const [values, setValues] = useState({ metaPixelId: "", metaCapiAccessToken: "", metaTestEventCode: "", googleMeasurementId: "", googleApiSecret: "", leadPilotUrl: "", leadPilotIngestKey: "", leadPilotConfirmed: false });
  const [status, setStatus] = useState<Status | null>(null);
  const [checks, setChecks] = useState<Record<string, Health> | null>(null);
  const [message, setMessage] = useState("Paste the AgentSiraji credentials, then save and run the health check.");
  const [busy, setBusy] = useState(false);

  function change(name: keyof typeof values, value: string | boolean) { setValues(current => ({ ...current, [name]: value })); }
  async function request(method: "GET" | "PUT") {
    const response = await fetch("/api/admin/integrations", { method, headers: { "x-agentsiraji-admin-token": token, ...(method === "PUT" ? { "content-type": "application/json" } : {}) }, body: method === "PUT" ? JSON.stringify(values) : undefined, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Integration request failed.");
    return data;
  }
  async function save() { setBusy(true); setMessage("Encrypting and saving integration settings…"); try { await request("PUT"); setMessage("Saved securely. Checking connectivity…"); await check(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save settings."); } finally { setBusy(false); } }
  async function check() { setBusy(true); try { const data = await request("GET"); setStatus(data.status); setChecks(data.checks); setMessage("Health check complete. Secrets are never displayed here."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to check integrations."); } finally { setBusy(false); } }
  const input = (name: Exclude<keyof typeof values, "leadPilotConfirmed">, label: string, secret = false, placeholder = "") => <label style={{ display: "grid", gap: 7 }}><strong>{label}</strong><input type={secret ? "password" : "text"} value={values[name]} onChange={event => change(name, event.target.value)} placeholder={placeholder} autoComplete="off" /></label>;
  const badge = (health?: Health) => health?.state === "healthy" ? "Healthy" : health?.state === "unverified" ? "Reachable — delivery unverified" : health?.state === "error" ? "Needs attention" : "Not configured";
  return <div style={{ display: "grid", gap: 22 }}>
    <p>Leave fields blank to keep their saved values. Enter a value only when adding or replacing a setting.</p>
    <section className="glass-card" style={{ padding: 24 }}><label style={{ display: "grid", gap: 7 }}><strong>Admin token</strong><input type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="Paste your server admin token" autoComplete="off" /></label><p style={{ color: "#5d7090", fontSize: 13, marginTop: 12 }}>This token stays in this browser tab. It is required before any setting is read or changed.</p></section>
    <section className="glass-card" style={{ padding: 24 }}><h2>Meta</h2><p>Use only the AgentSiraji pixel and its Conversions API token. The health check sends one synthetic PageView to Meta Test Events using your test code; Purchase events remain disabled.</p><div className="form-row">{input("metaPixelId", "Pixel ID", false, "1234567890")}{input("metaTestEventCode", "Test event code (sandbox)", true, "TEST12345")}</div>{input("metaCapiAccessToken", "Conversions API access token", true, "Never paste a SirajiBD token")}</section>
    <section className="glass-card" style={{ padding: 24 }}><h2>Google measurement</h2><p>Store a GA4 measurement ID or Google Ads conversion ID for the AgentSiraji property. The API secret is optional and stays server-side.</p><div className="form-row">{input("googleMeasurementId", "Measurement / Ads ID", false, "G-XXXXXXXXXX")}{input("googleApiSecret", "Google API secret (optional)", true)}</div></section>
    <section className="glass-card" style={{ padding: 24 }}><h2>LeadPilot</h2><p>Use the AgentSiraji-only website-lead endpoint. The connection check never submits a customer lead.</p>{input("leadPilotUrl", "HTTPS lead endpoint", false, "https://…")}{input("leadPilotIngestKey", "Ingest key", true)}<label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14 }}><input type="checkbox" checked={values.leadPilotConfirmed} onChange={event => change("leadPilotConfirmed", event.target.checked)} /><span>I confirm this endpoint and key belong only to AgentSiraji’s LeadPilot workspace.</span></label></section>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button className="button button-primary" type="button" onClick={save} disabled={!token || busy}>{busy ? "Working…" : "Save & check connections"}</button><button className="button button-secondary" type="button" onClick={check} disabled={!token || busy}>Refresh health</button></div>
    <p role="status" className="form-message">{message}</p>
    {checks ? <section className="glass-card" style={{ padding: 24 }}><h2>Connection health</h2><div style={{ display: "grid", gap: 14 }}>{([["Meta", checks.meta], ["Google", checks.google], ["LeadPilot", checks.leadPilot]] as const).map(([name, health]) => <article key={name} style={{ borderTop: "1px solid rgba(34,76,137,.14)", paddingTop: 14 }}><strong>{name}: {badge(health)}</strong><p style={{ color: "#5d7090", margin: "6px 0 0" }}>{health.detail}</p></article>)}</div><p style={{ color: "#5d7090", fontSize: 13, marginTop: 18 }}>Configured values are shown only as redacted identifiers: {status?.meta.pixelId || "no Meta pixel"}, {status?.google.measurementId || "no Google ID"}, {status?.leadPilot.endpoint || "no LeadPilot endpoint"}.</p></section> : null}
  </div>;
}
