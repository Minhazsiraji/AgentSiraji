"use client";

import { FormEvent, useMemo, useState } from "react";

type Lead = {
  id: string;
  businessName: string;
  country: string;
  city: string | null;
  platform: string;
  profileUrl: string | null;
  category: string | null;
  sellingMethod: string | null;
  score: number;
  messageVariant: string | null;
  personalizedDm: string | null;
  status: string;
  replyStatus: string;
  firstSentAt: string | null;
  nextFollowupAt: string | null;
  followupCount: number;
  demoSent: boolean;
  proposalSent: boolean;
  closed: boolean;
  setupValueUsd: number;
  monthlyValueUsd: number;
  isPartner: boolean;
  notes: string | null;
};

type Dashboard = {
  serverNow: string;
  leads: Lead[];
  countries: Array<{
    country: string;
    leads: number;
    sent: number;
    replies: number;
    replyRate: number;
    demos: number;
    proposals: number;
    closed: number;
    setupRevenueUsd: number;
    monthlyRevenueUsd: number;
  }>;
  summary: {
    totalLeads: number;
    sent: number;
    replies: number;
    positiveReplies: number;
    demos: number;
    proposals: number;
    closed: number;
    followupsDue: number;
    setupRevenueUsd: number;
    monthlyRevenueUsd: number;
  };
};

type ApiPayload = Partial<Dashboard> & {
  ok?: boolean;
  error?: string;
  lead?: Lead;
  imported?: number;
  skipped?: number;
  errors?: Array<{ index: number; reason: string }>;
};

type LeadAction =
  | "MARK_SENT"
  | "FOLLOW_UP"
  | "POSITIVE_REPLY"
  | "MAYBE_LATER"
  | "NOT_INTERESTED"
  | "DO_NOT_CONTACT"
  | "AUDIT_SENT"
  | "DEMO_SENT"
  | "PROPOSAL_SENT"
  | "CLOSED_WON";

type View = "TODAY" | "FOLLOWUP" | "PARTNER" | "ALL" | "IMPORT" | "COUNTRIES";

const emptyForm = {
  businessName: "",
  country: "Nepal",
  city: "",
  platform: "Instagram",
  profileUrl: "",
  category: "",
  sellingMethod: "Social-only / DM ordering",
  score: "80",
  personalizedDm: "",
  notes: "",
  isPartner: false,
};

const batchExample = `[
  {
    "businessName": "Example Fashion",
    "country": "Nepal",
    "city": "Kathmandu",
    "platform": "Instagram",
    "profileUrl": "https://instagram.com/example",
    "category": "Fashion",
    "sellingMethod": "DM ordering",
    "score": 86,
    "personalizedDm": "Hi Example Fashion...",
    "notes": "Active social seller; no clear checkout.",
    "isPartner": false
  }
]`;

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

const compactGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: ".7rem",
} as const;

const actionRow = {
  display: "flex",
  gap: ".55rem",
  flexWrap: "wrap",
  alignItems: "center",
} as const;

export function ForeignOutreachConsole() {
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState<View>("TODAY");
  const [batchText, setBatchText] = useState("");

  const visibleLeads = useMemo(() => {
    if (!dashboard) return [];
    const serverNow = new Date(dashboard.serverNow).getTime();
    if (view === "FOLLOWUP") {
      return dashboard.leads.filter(
        (lead) => lead.nextFollowupAt && new Date(lead.nextFollowupAt).getTime() <= serverNow && !lead.closed,
      );
    }
    if (view === "PARTNER") return dashboard.leads.filter((lead) => lead.isPartner && !lead.closed);
    if (view === "TODAY") return dashboard.leads.filter((lead) => !lead.closed && !lead.isPartner);
    if (view === "ALL") return dashboard.leads;
    return [];
  }, [dashboard, view]);

  async function load() {
    if (!token.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/outreach", {
        headers: { "x-agentsiraji-admin-token": token.trim() },
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok || !payload.serverNow || !payload.summary || !payload.leads || !payload.countries) {
        setDashboard(null);
        setMessage(payload.error || "Outreach data could not be loaded.");
        return;
      }
      setDashboard({
        serverNow: payload.serverNow,
        summary: payload.summary,
        leads: payload.leads,
        countries: payload.countries,
      });
    } catch {
      setMessage("The outreach API could not be reached.");
    } finally {
      setLoading(false);
    }
  }

  async function request(body: object) {
    const response = await fetch("/api/admin/outreach", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-agentsiraji-admin-token": token.trim(),
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as ApiPayload;
    if (!response.ok) throw new Error(payload.error || "Outreach operation failed.");
    return payload;
  }

  async function importBatch() {
    setLoading(true);
    setMessage("");
    try {
      const parsed = JSON.parse(batchText) as unknown;
      const leads = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && "leads" in parsed
          ? (parsed as { leads: unknown }).leads
          : null;
      if (!Array.isArray(leads)) throw new Error("Paste a JSON array of leads, or an object containing a leads array.");
      const payload = await request({ type: "CREATE_LEADS_BATCH", leads });
      const failed = payload.errors?.length ?? 0;
      setMessage(
        `Imported ${payload.imported ?? 0} lead(s). ${payload.skipped ?? 0} duplicate(s) skipped${failed ? `; ${failed} item(s) need correction` : ""}.`,
      );
      if ((payload.imported ?? 0) > 0) {
        setBatchText("");
        await load();
        setView("TODAY");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Batch import failed.");
    } finally {
      setLoading(false);
    }
  }

  async function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await request({ type: "CREATE_LEAD", ...form, score: Number(form.score) });
      setForm({ ...emptyForm, country: form.country, platform: form.platform });
      setMessage("Lead added to the outreach database.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lead could not be added.");
    } finally {
      setLoading(false);
    }
  }

  async function act(lead: Lead, action: LeadAction) {
    setLoading(true);
    setMessage("");
    try {
      let setupValueUsd = 0;
      let monthlyValueUsd = 0;
      if (action === "CLOSED_WON") {
        const setup = window.prompt("Setup value in USD", String(lead.setupValueUsd || 299));
        if (setup === null) return;
        const monthly = window.prompt("Monthly recurring value in USD", String(lead.monthlyValueUsd || 25));
        if (monthly === null) return;
        setupValueUsd = Number(setup);
        monthlyValueUsd = Number(monthly);
      }
      await request({ type: "ACTION", id: lead.id, action, setupValueUsd, monthlyValueUsd });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lead could not be updated.");
    } finally {
      setLoading(false);
    }
  }

  async function copyDm(text: string | null) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("DM copied. Review the prospect page once before sending.");
    } catch {
      setMessage("Copy failed. Select the DM text manually.");
    }
  }

  if (!dashboard) {
    return (
      <form
        className="product-card lead-card"
        style={{ maxWidth: "34rem", padding: "1.25rem" }}
        onSubmit={(event) => { event.preventDefault(); void load(); }}
      >
        <div className="product-copy">
          <span className="status">Private workspace</span>
          <h3 style={{ marginTop: ".8rem" }}>Unlock sales operations</h3>
          <p>The token stays only in this browser tab and is sent only to the protected outreach API.</p>
          <label>
            <strong>Admin token</strong><br />
            <input
              type="password"
              required
              autoComplete="off"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Outreach admin token"
            />
          </label>
          <button className="button button-primary" disabled={loading} type="submit">
            {loading ? "Loading…" : "Open workspace →"}
          </button>
          {message && <p aria-live="polite"><strong>{message}</strong></p>}
        </div>
      </form>
    );
  }

  const s = dashboard.summary;
  const kpis = [
    ["Leads", s.totalLeads],
    ["Sent", s.sent],
    ["Replies", s.replies],
    ["Positive", s.positiveReplies],
    ["Follow-ups", s.followupsDue],
    ["Demos", s.demos],
    ["Proposals", s.proposals],
    ["Closed", s.closed],
  ];

  return (
    <div>
      <section style={compactGrid}>
        {kpis.map(([label, value]) => (
          <article className="product-card" key={String(label)} style={{ padding: "1rem 1.1rem", minHeight: 0 }}>
            <span className="product-label">{label}</span>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, marginTop: ".25rem" }}>{value}</div>
          </article>
        ))}
      </section>

      <section
        className="product-card"
        style={{ padding: ".85rem 1rem", marginTop: ".8rem", marginBottom: ".8rem" }}
      >
        <div style={{ ...actionRow, justifyContent: "space-between" }}>
          <div style={actionRow}>
            {([
              ["TODAY", "Today"],
              ["FOLLOWUP", `Follow-ups (${s.followupsDue})`],
              ["PARTNER", "Partners"],
              ["ALL", "All leads"],
              ["IMPORT", "+ Import leads"],
              ["COUNTRIES", "Countries"],
            ] as Array<[View, string]>).map(([name, label]) => (
              <button
                type="button"
                className={view === name ? "button button-primary" : "button"}
                key={name}
                onClick={() => setView(name)}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ ...actionRow, fontSize: ".92rem" }}>
            <span><strong>${s.setupRevenueUsd.toFixed(0)}</strong> setup</span>
            <span><strong>${s.monthlyRevenueUsd.toFixed(0)}</strong>/mo</span>
            <button className="button" type="button" onClick={() => void load()} disabled={loading}>Refresh</button>
          </div>
        </div>
      </section>

      {message && (
        <div className="product-card" style={{ padding: ".8rem 1rem", marginBottom: ".8rem" }} aria-live="polite">
          <strong>{message}</strong>
        </div>
      )}

      {(view === "TODAY" || view === "FOLLOWUP" || view === "PARTNER" || view === "ALL") && (
        <section>
          <div style={{ ...actionRow, justifyContent: "space-between", margin: "1rem 0 .75rem" }}>
            <div>
              <span className="kicker">Daily operating queue</span>
              <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.7rem)", margin: ".2rem 0 0" }}>
                {view === "FOLLOWUP" ? "Follow-ups due" : view === "PARTNER" ? "Partner pipeline" : view === "ALL" ? "All outreach leads" : "Today’s send queue"}
              </h2>
            </div>
            <p style={{ margin: 0 }}>Open prospect → review → copy DM → send → mark sent.</p>
          </div>

          <div style={{ display: "grid", gap: ".8rem" }}>
            {visibleLeads.map((lead) => (
              <article className="product-card" key={lead.id} style={{ padding: "1rem 1.15rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, .8fr)", gap: "1rem" }}>
                  <div>
                    <div style={actionRow}>
                      <span className="status">{lead.score}/100 · {lead.status}</span>
                      <span className="product-label">{lead.country}{lead.city ? ` · ${lead.city}` : ""}</span>
                      {lead.isPartner && <span className="product-label">Partner</span>}
                    </div>
                    <h3 style={{ margin: ".55rem 0 .3rem" }}>{lead.businessName}</h3>
                    <p style={{ margin: 0 }}><strong>{lead.platform}</strong> · {lead.category || "Commerce prospect"} · {lead.sellingMethod || "Selling method not recorded"}</p>
                    {lead.notes && <p style={{ marginBottom: 0 }}><strong>Opportunity:</strong> {lead.notes}</p>}
                  </div>
                  <div>
                    <p style={{ marginTop: 0 }}>
                      <strong>Reply:</strong> {lead.replyStatus.replaceAll("_", " ")}<br />
                      <strong>First sent:</strong> {fmtDate(lead.firstSentAt)}<br />
                      <strong>Next follow-up:</strong> {fmtDate(lead.nextFollowupAt)} · {lead.followupCount}/2
                    </p>
                    {lead.personalizedDm && (
                      <details>
                        <summary><strong>Prepared DM</strong></summary>
                        <p style={{ whiteSpace: "pre-wrap" }}>{lead.personalizedDm}</p>
                      </details>
                    )}
                  </div>
                </div>

                <div style={{ ...actionRow, marginTop: ".85rem" }}>
                  {lead.profileUrl && <a className="button" href={lead.profileUrl} target="_blank" rel="noreferrer">Open prospect ↗</a>}
                  {lead.personalizedDm && <button className="button" type="button" onClick={() => void copyDm(lead.personalizedDm)}>Copy DM</button>}
                  {!lead.firstSentAt && <button className="button button-primary" type="button" disabled={loading} onClick={() => void act(lead, "MARK_SENT")}>Mark sent</button>}
                  {lead.firstSentAt && lead.replyStatus === "NO_REPLY" && lead.followupCount < 2 && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "FOLLOW_UP")}>Follow-up sent</button>}
                  {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "POSITIVE_REPLY")}>Positive reply</button>}
                  {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "AUDIT_SENT")}>Audit</button>}
                  {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "DEMO_SENT")}>Demo</button>}
                  {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "PROPOSAL_SENT")}>Proposal</button>}
                  {!lead.closed && <button className="button button-primary" type="button" disabled={loading} onClick={() => void act(lead, "CLOSED_WON")}>Closed won</button>}
                  {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "NOT_INTERESTED")}>Not interested</button>}
                </div>
              </article>
            ))}
            {visibleLeads.length === 0 && (
              <article className="product-card" style={{ padding: "1.2rem" }}>
                <h3 style={{ marginTop: 0 }}>No leads in this queue.</h3>
                <p style={{ marginBottom: 0 }}>Use <strong>+ Import leads</strong> to load today&apos;s researched batch.</p>
              </article>
            )}
          </div>
        </section>
      )}

      {view === "IMPORT" && (
        <section>
          <div style={{ margin: "1rem 0 .75rem" }}>
            <span className="kicker">Fast intake</span>
            <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.7rem)", margin: ".2rem 0" }}>Import today&apos;s leads</h2>
            <p>Paste one JSON batch from the scheduled ChatGPT research. Maximum 50 leads per import; duplicate profile URLs are skipped.</p>
          </div>

          <article className="product-card" style={{ padding: "1rem 1.15rem" }}>
            <label>
              <strong>Today&apos;s researched lead batch</strong><br />
              <textarea
                rows={16}
                value={batchText}
                onChange={(event) => setBatchText(event.target.value)}
                placeholder={batchExample}
                style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              />
            </label>
            <div style={{ ...actionRow, marginTop: ".7rem" }}>
              <button className="button button-primary" type="button" onClick={() => void importBatch()} disabled={loading || !batchText.trim()}>
                {loading ? "Importing…" : "Import today’s leads →"}
              </button>
              <button className="button" type="button" onClick={() => setBatchText(batchExample)}>Load format example</button>
            </div>
          </article>

          <details className="product-card" style={{ padding: "1rem 1.15rem", marginTop: ".8rem" }}>
            <summary><strong>Add one lead manually</strong></summary>
            <form onSubmit={addLead} style={{ marginTop: "1rem" }}>
              <div style={compactGrid}>
                <label><strong>Business name</strong><br /><input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></label>
                <label><strong>Country</strong><br /><input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
                <label><strong>City</strong><br /><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
                <label><strong>Platform</strong><br />
                  <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                    <option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>Email</option><option>Website</option><option>WhatsApp</option><option>Other</option>
                  </select>
                </label>
                <label><strong>Category</strong><br /><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
                <label><strong>Score</strong><br /><input required type="number" min="0" max="100" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} /></label>
              </div>
              <label><strong>Public profile / website</strong><br /><input type="url" value={form.profileUrl} onChange={(e) => setForm({ ...form, profileUrl: e.target.value })} placeholder="https://…" /></label>
              <label><strong>Current selling method</strong><br /><input value={form.sellingMethod} onChange={(e) => setForm({ ...form, sellingMethod: e.target.value })} /></label>
              <label><strong>Personalized DM</strong><br /><textarea rows={5} value={form.personalizedDm} onChange={(e) => setForm({ ...form, personalizedDm: e.target.value })} /></label>
              <label><strong>Research note</strong><br /><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
              <label><input type="checkbox" checked={form.isPartner} onChange={(e) => setForm({ ...form, isPartner: e.target.checked })} /> <strong>Partner prospect</strong></label><br />
              <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Saving…" : "Add lead →"}</button>
            </form>
          </details>
        </section>
      )}

      {view === "COUNTRIES" && (
        <section>
          <div style={{ margin: "1rem 0 .75rem" }}>
            <span className="kicker">Market intelligence</span>
            <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.7rem)", margin: ".2rem 0" }}>Country performance</h2>
            <p>Reply and close data determines where AgentSiraji should increase outreach and ad spend.</p>
          </div>
          <div style={compactGrid}>
            {dashboard.countries.map((country) => (
              <article className="product-card" key={country.country} style={{ padding: "1rem 1.1rem" }}>
                <span className="product-label">{country.country}</span>
                <h3 style={{ margin: ".35rem 0" }}>{(country.replyRate * 100).toFixed(1)}% reply</h3>
                <p style={{ margin: 0 }}>{country.leads} leads · {country.sent} sent · {country.replies} replies<br />{country.demos} demos · {country.proposals} proposals · {country.closed} clients</p>
                <p><strong>${country.setupRevenueUsd.toFixed(0)}</strong> setup · <strong>${country.monthlyRevenueUsd.toFixed(0)}</strong>/mo</p>
              </article>
            ))}
            {dashboard.countries.length === 0 && (
              <article className="product-card" style={{ padding: "1rem" }}><p style={{ margin: 0 }}>Country performance appears after leads are imported.</p></article>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
