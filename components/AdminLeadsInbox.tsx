"use client";

import { useEffect, useMemo, useState } from "react";

const statuses = ["ALL", "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
type LeadStatus = Exclude<(typeof statuses)[number], "ALL">;
type Lead = {
  id: string; leadType: string; status: LeadStatus; businessName: string | null; contactName: string | null;
  country: string | null; storeUrl: string | null; email: string; phone: string | null; interest: string | null;
  message: string | null; ownerNote: string | null; paymentMethod: string | null; paymentReference: string | null;
  paymentStatus: "NOT_APPLICABLE" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  paymentExpectedAmount: number | null; paymentVerifiedAmount: number | null; paymentSenderHint: string | null;
  paymentDate: string | null; paymentVerificationNote: string | null; createdAt: string; updatedAt: string;
};

function source(lead: Lead) {
  if (lead.interest?.startsWith("Commerce sales —")) return "Direct Commerce plan";
  return lead.leadType === "STORE_AUDIT" ? "Free Store Audit" : "Contact enquiry";
}

function when(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(value));
}

export function AdminLeadsInbox() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("ALL");

  async function load() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/leads", { cache: "no-store" });
      const data = await response.json() as { leads?: Lead[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load leads.");
      setLeads(data.leads || []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load leads."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/leads", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { leads?: Lead[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to load leads.");
        return data;
      })
      .then((data) => { if (active) setLeads(data.leads || []); })
      .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Unable to load leads."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== "ALL" && lead.status !== status) return false;
      if (!q) return true;
      return [lead.id, lead.businessName, lead.contactName, lead.email, lead.phone, lead.country, lead.interest, lead.message]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
    });
  }, [leads, query, status]);

  async function move(lead: Lead, next: LeadStatus) {
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: lead.id, status: next, ownerNote: lead.ownerNote, paymentStatus: lead.paymentStatus,
          paymentMethod: lead.paymentStatus === "NOT_APPLICABLE" ? null : (lead.paymentMethod || "BKASH_SEND_MONEY"),
          paymentReference: lead.paymentReference, paymentExpectedAmount: lead.paymentExpectedAmount,
          paymentVerifiedAmount: lead.paymentVerifiedAmount, paymentSenderHint: lead.paymentSenderHint,
          paymentDate: lead.paymentDate, paymentVerificationNote: lead.paymentVerificationNote,
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to update lead.");
      setLeads((items) => items.map((item) => item.id === lead.id ? { ...item, status: next } : item));
      setMessage(`Lead #${lead.id} moved to ${next}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update lead."); }
  }

  function review(lead: Lead) {
    window.dispatchEvent(new CustomEvent("agentsiraji:lead-review", { detail: lead }));
    document.getElementById("lead-review-console")?.scrollIntoView({ behavior: "smooth" });
  }

  return <div className="product-card lead-card" style={{ gridColumn: "1 / -1" }}>
    <div className="card-top"><span className="status">Authenticated inbox</span><span className="card-num">01</span></div>
    <div className="product-copy">
      <span className="product-label">Sales operations</span><h3>Leads inbox</h3>
      <p>Store Audits, contact enquiries and direct Commerce plan requests appear here. WON remains protected by verified payment and owner provisioning.</p>
      <div className="form-row">
        <label><strong>Search</strong><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Business, contact, email, phone or lead #" /></label>
        <label><strong>Status</strong><select value={status} onChange={(e) => setStatus(e.target.value as (typeof statuses)[number])}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <button type="button" className="button button-primary" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh inbox →"}</button>
      {message ? <p role="status">{message}</p> : null}
      <p><strong>{filtered.length}</strong> lead(s) shown.</p>
      <div style={{ display: "grid", gap: 14 }}>
        {filtered.map((lead) => <article key={lead.id} className="contact-note" style={{ margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div><span className="kicker">Lead #{lead.id} · {source(lead)}</span><h4 style={{ margin: "6px 0" }}>{lead.businessName || lead.contactName || lead.email}</h4><p style={{ margin: 0 }}><strong>{lead.interest || "No package/topic"}</strong></p></div>
            <span className="status">{lead.status}</span>
          </div>
          <p><strong>Contact:</strong> {lead.contactName || "—"} · {lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p>
          <p><strong>Country:</strong> {lead.country || "—"} · <strong>Created:</strong> {when(lead.createdAt)} · <strong>Payment:</strong> {lead.paymentStatus}</p>
          {lead.message ? <p><strong>Request:</strong> {lead.message}</p> : null}
          {lead.ownerNote ? <p><strong>Owner note:</strong> {lead.ownerNote}</p> : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lead.status === "NEW" ? <button type="button" className="button button-small button-dark" onClick={() => void move(lead, "CONTACTED")}>Mark contacted</button> : null}
            {lead.status === "CONTACTED" ? <button type="button" className="button button-small button-dark" onClick={() => void move(lead, "QUALIFIED")}>Mark qualified</button> : null}
            {lead.status === "QUALIFIED" ? <button type="button" className="button button-small button-dark" onClick={() => void move(lead, "PROPOSAL")}>Move to proposal</button> : null}
            {lead.status !== "WON" && lead.status !== "LOST" ? <button type="button" className="button button-small button-dark" onClick={() => void move(lead, "LOST")}>Mark lost</button> : null}
            {lead.status !== "WON" ? <button type="button" className="button button-primary button-small" onClick={() => review(lead)}>Review / payment →</button> : null}
          </div>
        </article>)}
        {!loading && filtered.length === 0 ? <p>No leads match the current filters.</p> : null}
      </div>
    </div>
  </div>;
}
