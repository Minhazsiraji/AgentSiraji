"use client";

import { useState } from "react";
import { marketingConsentKey } from "@/lib/meta-client";

type Health = { state: "missing" | "healthy" | "error" | "unverified"; detail: string };
type Status = { meta: { configured: boolean; pixelId: string; testMode: boolean }; google: { configured: boolean; measurementId: string }; leadPilot: { configured: boolean; endpoint: string } };
type BrowserHealth = { state: "healthy" | "blocked" | "unverified" | "error"; detail: string };
type BrowserChecks = { consent: string; meta: BrowserHealth; google: BrowserHealth };

function browserBadge(health?: BrowserHealth) {
  if (health?.state === "healthy") return "Dispatch observed";
  if (health?.state === "blocked") return "Blocked by consent — expected";
  if (health?.state === "error") return "Needs attention";
  return "Loader active — dispatch unverified";
}

export function IntegrationSettings() {
  const [token, setToken] = useState("");
  const [values, setValues] = useState({ metaPixelId: "", metaCapiAccessToken: "", metaTestEventCode: "", googleMeasurementId: "", googleApiSecret: "", leadPilotUrl: "", leadPilotIngestKey: "", leadPilotConfirmed: false });
  const [status, setStatus] = useState<Status | null>(null);
  const [checks, setChecks] = useState<Record<string, Health> | null>(null);
  const [browserChecks, setBrowserChecks] = useState<BrowserChecks | null>(null);
  const [message, setMessage] = useState("Enter the owner token to review health. Add values only when configuring or replacing a setting.");
  const [busy, setBusy] = useState(false);
  const [browserBusy, setBrowserBusy] = useState(false);

  function change(name: keyof typeof values, value: string | boolean) { setValues(current => ({ ...current, [name]: value })); }
  async function request(method: "GET" | "PUT") {
    const response = await fetch("/api/admin/integrations", { method, headers: { "x-agentsiraji-admin-token": token, ...(method === "PUT" ? { "content-type": "application/json" } : {}) }, body: method === "PUT" ? JSON.stringify(values) : undefined, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Integration request failed.");
    return data;
  }
  async function save() { setBusy(true); setMessage("Encrypting and saving integration settings…"); try { await request("PUT"); setMessage("Saved securely. Checking connectivity…"); await check(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save settings."); } finally { setBusy(false); } }
  async function check() { setBusy(true); try { const data = await request("GET"); setStatus(data.status); setChecks(data.checks); setMessage("Server health check complete. Saved secrets were not returned to this browser."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to check integrations."); } finally { setBusy(false); } }

  async function runBrowserChecks() {
    setBrowserBusy(true);
    try {
      const response = await fetch("/api/integrations/public", { cache: "no-store" });
      const publicConfig = await response.json() as { pixelId?: unknown; googleTagId?: unknown };
      let consent = "not chosen";
      try {
        const saved = window.localStorage.getItem(marketingConsentKey);
        if (saved === "granted") consent = "granted";
        else if (saved === "denied") consent = "declined";
      } catch { consent = "storage unavailable"; }

      const resources = performance.getEntriesByType("resource").map(entry => entry.name);
      const metaConfigured = typeof publicConfig.pixelId === "string" && /^\d+$/.test(publicConfig.pixelId);
      const googleConfigured = typeof publicConfig.googleTagId === "string" && /^(G-|AW-|GT-)/i.test(publicConfig.googleTagId);
      const metaLoader = typeof window.fbq === "function" || resources.some(name => name.includes("connect.facebook.net") && name.includes("fbevents.js"));
      const metaDispatch = resources.some(name => name.includes("facebook.com/tr"));
      const googleLoader = Boolean(window.gtag) || (Array.isArray(window.dataLayer) && resources.some(name => name.includes("googletagmanager.com/gtag/js")));
      const googleDispatch = resources.some(name => /google-analytics\.com\/(g\/)?collect|analytics\.google\.com\/(g\/)?collect/i.test(name));

      const blocked = (name: string): BrowserHealth => ({ state: "blocked", detail: `${name} browser measurement is not expected until measurement consent is granted.` });
      const missing = (name: string): BrowserHealth => ({ state: "error", detail: `${name} is not publicly configured for this deployment.` });
      const observed = (name: string, loader: boolean, dispatch: boolean): BrowserHealth => dispatch
        ? { state: "healthy", detail: `${name} network dispatch is visible in this tab's Resource Timing entries.` }
        : loader
          ? { state: "unverified", detail: `${name} loader is active in this tab. No outbound measurement request is visible in Resource Timing yet; vendor dashboards remain the receipt authority.` }
          : { state: "error", detail: `${name} is configured and consent is granted, but its browser loader is not active in this tab.` };

      setBrowserChecks({
        consent,
        meta: !metaConfigured ? missing("Meta Pixel") : consent !== "granted" ? blocked("Meta Pixel") : observed("Meta Pixel", metaLoader, metaDispatch),
        google: !googleConfigured ? missing("Google tag") : consent !== "granted" ? blocked("Google tag") : observed("Google tag", googleLoader, googleDispatch),
      });
    } catch {
      setBrowserChecks({
        consent: "unknown",
        meta: { state: "error", detail: "Browser diagnostics could not read the public integration configuration." },
        google: { state: "error", detail: "Browser diagnostics could not read the public integration configuration." },
      });
    } finally { setBrowserBusy(false); }
  }

  const input = (name: Exclude<keyof typeof values, "leadPilotConfirmed">, label: string, secret = false, placeholder = "") => <label style={{ display: "grid", gap: 7 }}><strong>{label}</strong><input type={secret ? "password" : "text"} value={values[name]} onChange={event => change(name, event.target.value)} placeholder={placeholder} autoComplete="off" /></label>;
  const badge = (health?: Health) => health?.state === "healthy" ? "Healthy" : health?.state === "unverified" ? "Reachable — delivery unverified" : health?.state === "error" ? "Needs attention" : "Not configured";
  return <div style={{ display: "grid", gap: 22 }}>
    <p>Leave credential fields blank to keep their saved encrypted values. Enter a value only when adding or replacing a setting.</p>
    <section className="glass-card" style={{ padding: 24 }}><label style={{ display: "grid", gap: 7 }}><strong>Owner admin token</strong><input type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="Enter owner token" autoComplete="off" /></label><p style={{ color: "#5d7090", fontSize: 13, marginTop: 12 }}>This token stays only in this browser tab. It is required before configuration status is read or changed.</p></section>
    <section className="glass-card" style={{ padding: 24 }}><h2>Meta Pixel + CAPI</h2><p>Use only the AgentSiraji Pixel and its Conversions API token. The server health check can send one synthetic PageView to Meta Test Events using your test code; Purchase events remain disabled.</p><div className="form-row">{input("metaPixelId", "Pixel ID", false, "1234567890")}{input("metaTestEventCode", "Test Event Code", true, "TEST12345")}</div>{input("metaCapiAccessToken", "Conversions API access token", true, "Server-side secret")}</section>
    <section className="glass-card" style={{ padding: 24 }}><h2>Google tag</h2><p>Store the AgentSiraji Google tag ID. Supported public IDs start with G-, AW- and GT-. The browser tag uses the ID only after measurement consent. The optional API secret is not required for normal browser tagging and remains server-side if you later use Measurement Protocol.</p><div className="form-row">{input("googleMeasurementId", "Google tag / measurement ID", false, "G-XXXXXXXXXX, AW-XXXXXXXXX or GT-XXXXXXX")}{input("googleApiSecret", "Google API secret (optional)", true, "Leave blank for browser-only tagging")}</div></section>
    <section className="glass-card" style={{ padding: 24 }}><h2>LeadPilot</h2><p>Use the AgentSiraji-only website-lead endpoint. The server check authenticates the ingest key with a deliberately invalid payload that stops at validation and creates no lead. Real Store Audit and Contact leads are mirrored only after AgentSiraji saves them successfully.</p>{input("leadPilotUrl", "HTTPS lead endpoint", false, "https://…")}{input("leadPilotIngestKey", "Ingest key", true, "Server-side secret")}<label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14 }}><input type="checkbox" checked={values.leadPilotConfirmed} onChange={event => change("leadPilotConfirmed", event.target.checked)} /><span>I confirm this endpoint and key belong only to AgentSiraji’s LeadPilot workspace.</span></label></section>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button className="button button-primary" type="button" onClick={save} disabled={token.trim().length < 32 || busy}>{busy ? "Working…" : "Save & check connections"}</button><button className="button button-secondary" type="button" onClick={check} disabled={token.trim().length < 32 || busy}>Refresh server health</button><button className="button button-secondary" type="button" onClick={runBrowserChecks} disabled={browserBusy}>{browserBusy ? "Checking browser…" : "Run browser delivery checks"}</button></div>
    <p role="status" className="form-message">{message}</p>
    {checks ? <section className="glass-card" style={{ padding: 24 }}><h2>Server + delivery health</h2><div style={{ display: "grid", gap: 14 }}>{([["Meta CAPI", checks.meta], ["Google loader", checks.google], ["LeadPilot", checks.leadPilot]] as const).map(([name, health]) => <article key={name} style={{ borderTop: "1px solid rgba(34,76,137,.14)", paddingTop: 14 }}><strong>{name}: {badge(health)}</strong><p style={{ color: "#5d7090", margin: "6px 0 0" }}>{health.detail}</p></article>)}</div><p style={{ color: "#5d7090", fontSize: 13, marginTop: 18 }}>Configured values are shown only as redacted identifiers: {status?.meta.pixelId || "no Meta pixel"}, {status?.google.measurementId || "no Google tag"}, {status?.leadPilot.endpoint || "no LeadPilot endpoint"}.</p></section> : null}
    {browserChecks ? <section className="glass-card" style={{ padding: 24 }}><h2>Current browser delivery</h2><p>Measurement consent in this browser: <strong>{browserChecks.consent}</strong>. This check observes existing loaders and network timing only; it does not generate a test conversion.</p><div style={{ display: "grid", gap: 14 }}>{([["Meta Pixel", browserChecks.meta], ["Google tag", browserChecks.google]] as const).map(([name, health]) => <article key={name} style={{ borderTop: "1px solid rgba(34,76,137,.14)", paddingTop: 14 }}><strong>{name}: {browserBadge(health)}</strong><p style={{ color: "#5d7090", margin: "6px 0 0" }}>{health.detail}</p></article>)}</div><p style={{ color: "#5d7090", fontSize: 13, marginTop: 18 }}>Meta Events Manager and GA4 Realtime/DebugView remain the final authority that each vendor received and processed a browser event.</p></section> : null}
  </div>;
}
