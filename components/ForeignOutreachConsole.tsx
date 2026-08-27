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

type ApiPayload = Partial<Dashboard> & { ok?: boolean; error?: string; lead?: Lead };

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

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function ForeignOutreachConsole() {
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<"ACTIVE" | "FOLLOWUP" | "PARTNER" | "ALL">("ACTIVE");

  const visibleLeads = useMemo(() => {
    if (!dashboard) return [];
    const now = Date.now();
    if (filter === "FOLLOWUP") {
      return dashboard.leads.filter((lead) => lead.nextFollowupAt && new Date(lead.nextFollowupAt).getTime() <= now && !lead.closed);
    }
    if (filter === "PARTNER") return dashboard.leads.filter((lead) => lead.isPartner && !lead.closed);
    if (filter === "ACTIVE") return dashboard.leads.filter((lead) => !lead.closed);
    return dashboard.leads;
  }, [dashboard, filter]);

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
      if (!response.ok || !payload.summary || !payload.leads || !payload.countries) {
        setDashboard(null);
        setMessage(payload.error || "Outreach data could not be loaded.");
        return;
      }
      setDashboard({ summary: payload.summary, leads: payload.leads, countries: payload.countries });
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

  async function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await request({
        type: "CREATE_LEAD",
        ...form,
        score: Number(form.score),
      });
      setForm({ ...emptyForm, country: form.country, platform: form.platform });
      setMessage("Lead added to the AgentSiraji outreach database.");
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
      setMessage("DM copied. Review it once on the prospect page before sending.");
    } catch {
      setMessage("Copy failed. Select the DM text manually.");
    }
  }

  if (!dashboard) {
    return (
      <div className="product-grid">
        <form className="product-card lead-card" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <div className="card-top">
            <span className="status">Private sales workspace</span>
            <span className="card-num">01</span>
          </div>
          <div className="product-copy">
            <span className="product-label">Foreign outreach access</span>
            <h3>Unlock the sales queue</h3>
            <p>Use the outreach admin token. It stays only in this browser tab state and is sent only with protected outreach API requests.</p>
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
              {loading ? "Loading…" : "Open outreach workspace →"}
            </button>
            {message && <p aria-live="polite"><strong>{message}</strong></p>}
          </div>
        </form>
      </div>
    );
  }

  const s = dashboard.summary;

  return (
    <div>
      <div className="product-grid">
        {[
          ["Leads", s.totalLeads],
          ["Sent", s.sent],
          ["Replies", s.replies],
          ["Positive", s.positiveReplies],
          ["Follow-ups due", s.followupsDue],
          ["Demos", s.demos],
          ["Proposals", s.proposals],
          ["Closed", s.closed],
        ].map(([label, value]) => (
          <article className="product-card" key={String(label)}>
            <div className="product-copy">
              <span className="product-label">{label}</span>
              <h3>{value}</h3>
            </div>
          </article>
        ))}
      </div>

      <div className="section-heading" style={{ marginTop: "3rem" }}>
        <div>
          <span className="kicker">Daily operating queue</span>
          <h2>Research. Personalize. <em>Human-approved send.</em></h2>
        </div>
        <p>Setup revenue: <strong>${s.setupRevenueUsd.toFixed(2)}</strong><br />Monthly recurring: <strong>${s.monthlyRevenueUsd.toFixed(2)}</strong></p>
      </div>

      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {(["ACTIVE", "FOLLOWUP", "PARTNER", "ALL"] as const).map((name) => (
          <button
            type="button"
            className={filter === name ? "button button-primary" : "button"}
            key={name}
            onClick={() => setFilter(name)}
          >
            {name === "FOLLOWUP" ? "Follow-ups due" : name === "PARTNER" ? "Partners" : name.charAt(0) + name.slice(1).toLowerCase()}
          </button>
        ))}
        <button className="button" type="button" onClick={() => void load()} disabled={loading}>Refresh</button>
      </div>

      {message && <p aria-live="polite"><strong>{message}</strong></p>}

      <div className="product-grid">
        {visibleLeads.map((lead) => (
          <article className="product-card lead-card" key={lead.id}>
            <div className="card-top">
              <span className="status">{lead.score}/100 · {lead.status}</span>
              <span className="card-num">{lead.country}</span>
            </div>
            <div className="product-copy">
              <span className="product-label">{lead.isPartner ? "Partner prospect" : lead.category || "Commerce prospect"}</span>
              <h3>{lead.businessName}</h3>
              <p>
                <strong>{lead.platform}</strong>{lead.city ? ` · ${lead.city}` : ""}<br />
                {lead.sellingMethod || "Selling method not recorded"}
              </p>
              <p><strong>Reply:</strong> {lead.replyStatus.replaceAll("_", " ")}<br />
                <strong>First sent:</strong> {fmtDate(lead.firstSentAt)}<br />
                <strong>Next follow-up:</strong> {fmtDate(lead.nextFollowupAt)} · {lead.followupCount}/2 used
              </p>
              {lead.personalizedDm && (
                <div>
                  <p><strong>Prepared DM</strong></p>
                  <p style={{ whiteSpace: "pre-wrap" }}>{lead.personalizedDm}</p>
                </div>
              )}
              {lead.notes && <p><strong>Lead note:</strong> {lead.notes}</p>}

              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                {lead.profileUrl && <a className="button" href={lead.profileUrl} target="_blank" rel="noreferrer">Open prospect ↗</a>}
                {lead.personalizedDm && <button className="button" type="button" onClick={() => void copyDm(lead.personalizedDm)}>Copy DM</button>}
                {!lead.firstSentAt && <button className="button button-primary" type="button" disabled={loading} onClick={() => void act(lead, "MARK_SENT")}>Mark sent</button>}
                {lead.firstSentAt && lead.replyStatus === "NO_REPLY" && lead.followupCount < 2 && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "FOLLOW_UP")}>Follow-up sent</button>}
                {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "POSITIVE_REPLY")}>Positive reply</button>}
                {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "AUDIT_SENT")}>Audit sent</button>}
                {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "DEMO_SENT")}>Demo</button>}
                {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "PROPOSAL_SENT")}>Proposal</button>}
                {!lead.closed && <button className="button button-primary" type="button" disabled={loading} onClick={() => void act(lead, "CLOSED_WON")}>Closed won</button>}
                {!lead.closed && <button className="button" type="button" disabled={loading} onClick={() => void act(lead, "NOT_INTERESTED")}>Not interested</button>}
              </div>
            </div>
          </article>
        ))}
        {visibleLeads.length === 0 && (
          <article className="product-card">
            <div className="product-copy"><h3>No leads in this queue.</h3><p>Add today&apos;s prospects below or switch the filter.</p></div>
          </article>
        )}
      </div>

      <div className="section-heading" style={{ marginTop: "3rem" }}>
        <div><span className="kicker">Lead intake</span><h2>Add today&apos;s researched <em>prospects.</em></h2></div>
        <p>The scheduled ChatGPT research can supply these fields. For now you can paste each qualified lead here; later we can add controlled batch import.</p>
      </div>

      <form className="product-card lead-card" onSubmit={addLead}>
        <div className="product-copy">
          <label><strong>Business name</strong><br /><input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></label>
          <label><strong>Country</strong><br /><input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
          <label><strong>City</strong><br /><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label><strong>Platform</strong><br />
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              <option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>Email</option><option>Website</option><option>WhatsApp</option><option>Other</option>
            </select>
          </label>
          <label><strong>Public profile / website</strong><br /><input type="url" value={form.profileUrl} onChange={(e) => setForm({ ...form, profileUrl: e.target.value })} placeholder="https://…" /></label>
          <label><strong>Category</strong><br /><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Fashion, cosmetics, electronics…" /></label>
          <label><strong>Current selling method</strong><br /><input value={form.sellingMethod} onChange={(e) => setForm({ ...form, sellingMethod: e.target.value })} /></label>
          <label><strong>Lead score (0–100)</strong><br /><input required type="number" min="0" max="100" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} /></label>
          <label><strong>Personalized DM</strong><br /><textarea rows={7} value={form.personalizedDm} onChange={(e) => setForm({ ...form, personalizedDm: e.target.value })} placeholder="Paste the researched, personalized DM here." /></label>
          <label><strong>Research note / opportunity</strong><br /><textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Why this business is a fit for AgentSiraji Commerce." /></label>
          <label><input type="checkbox" checked={form.isPartner} onChange={(e) => setForm({ ...form, isPartner: e.target.checked })} /> <strong>Agency / freelancer partner prospect</strong></label>
          <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Saving…" : "Add lead →"}</button>
        </div>
      </form>

      <div className="section-heading" style={{ marginTop: "3rem" }}>
        <div><span className="kicker">Country intelligence</span><h2>Let response data choose <em>where we scale.</em></h2></div>
      </div>
      <div className="product-grid">
        {dashboard.countries.map((country) => (
          <article className="product-card" key={country.country}>
            <div className="product-copy">
              <span className="product-label">{country.country}</span>
              <h3>{(country.replyRate * 100).toFixed(1)}% reply rate</h3>
              <p>{country.leads} leads · {country.sent} sent · {country.replies} replies<br />{country.demos} demos · {country.proposals} proposals · {country.closed} clients</p>
              <p><strong>${country.setupRevenueUsd.toFixed(0)}</strong> setup · <strong>${country.monthlyRevenueUsd.toFixed(0)}</strong>/mo</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
