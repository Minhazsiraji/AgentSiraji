"use client";

import { useEffect, useMemo, useState } from "react";

const statuses = ["ALL", "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
const sources = ["ALL", "DIRECT", "AUDIT", "CONTACT"] as const;
const PAGE_SIZE = 10;
type LeadStatus = Exclude<(typeof statuses)[number], "ALL">;
type SourceFilter = (typeof sources)[number];
type Lead = {
  id: string; leadType: string; status: LeadStatus; businessName: string | null; contactName: string | null;
  country: string | null; storeUrl: string | null; email: string; phone: string | null; interest: string | null;
  message: string | null; ownerNote: string | null; paymentMethod: string | null; paymentReference: string | null;
  paymentStatus: "NOT_APPLICABLE" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  paymentExpectedAmount: number | null; paymentVerifiedAmount: number | null; paymentSenderHint: string | null;
  paymentDate: string | null; paymentVerificationNote: string | null; createdAt: string; updatedAt: string;
};

function sourceKey(lead: Lead): Exclude<SourceFilter, "ALL"> {
  if (lead.interest?.startsWith("Commerce sales —")) return "DIRECT";
  return lead.leadType === "STORE_AUDIT" ? "AUDIT" : "CONTACT";
}

function sourceLabel(lead: Lead) {
  const value = sourceKey(lead);
  if (value === "DIRECT") return "Direct plan";
  if (value === "AUDIT") return "Store Audit";
  return "Contact";
}

function when(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(value));
}

function paymentLabel(value: Lead["paymentStatus"]) {
  return value === "NOT_APPLICABLE" ? "Not started" : value.replaceAll("_", " ");
}

export function AdminLeadsInbox() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/leads", { cache: "no-store" });
      const data = await response.json() as { leads?: Lead[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load leads.");
      setLeads(data.leads || []);
      setPage(1);
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
      if (sourceFilter !== "ALL" && sourceKey(lead) !== sourceFilter) return false;
      if (!q) return true;
      return [lead.id, lead.businessName, lead.contactName, lead.email, lead.phone, lead.country, lead.interest, lead.message]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
    });
  }, [leads, query, status, sourceFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetFilters(next: { query?: string; status?: (typeof statuses)[number]; source?: SourceFilter }) {
    if (next.query !== undefined) setQuery(next.query);
    if (next.status !== undefined) setStatus(next.status);
    if (next.source !== undefined) setSourceFilter(next.source);
    setPage(1);
  }

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
    document.getElementById("lead-review-console")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <div className="lead-inbox-shell">
    <div className="lead-inbox-head">
      <div><span className="product-label">Sales operations</span><h3>Leads inbox</h3><p>Compact pipeline view for Store Audits, contact enquiries and direct Commerce plan requests.</p></div>
      <button type="button" className="button button-primary button-small" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
    </div>

    <div className="lead-toolbar">
      <label><span>Search</span><input value={query} onChange={(e) => resetFilters({ query: e.target.value })} placeholder="Business, contact, email, phone or lead #" /></label>
      <label><span>Status</span><select value={status} onChange={(e) => resetFilters({ status: e.target.value as (typeof statuses)[number] })}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><span>Source</span><select value={sourceFilter} onChange={(e) => resetFilters({ source: e.target.value as SourceFilter })}><option value="ALL">ALL</option><option value="DIRECT">DIRECT PLAN</option><option value="AUDIT">STORE AUDIT</option><option value="CONTACT">CONTACT</option></select></label>
    </div>

    {message ? <p className="lead-message" role="status">{message}</p> : null}
    <div className="lead-list-summary"><strong>{filtered.length}</strong> lead(s) · showing {visible.length ? ((safePage - 1) * PAGE_SIZE) + 1 : 0}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</div>

    <div className="lead-list" role="table" aria-label="Sales leads">
      <div className="lead-list-header" role="row">
        <span>Lead</span><span>Customer</span><span>Plan / source</span><span>Status</span><span>Payment</span><span>Created</span><span>Action</span>
      </div>
      {visible.map((lead) => <div className="lead-list-row" role="row" key={lead.id}>
        <div className="lead-col lead-id" data-label="Lead"><strong>#{lead.id}</strong><small>{sourceLabel(lead)}</small></div>
        <div className="lead-col lead-customer" data-label="Customer"><strong>{lead.businessName || lead.contactName || lead.email}</strong><span>{lead.contactName || "—"}</span><a href={`mailto:${lead.email}`}>{lead.email}</a>{lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : null}</div>
        <div className="lead-col" data-label="Plan / source"><strong>{lead.interest || "General enquiry"}</strong><small>{lead.country || "Country not supplied"}</small></div>
        <div className="lead-col" data-label="Status"><span className={`lead-status lead-status-${lead.status.toLowerCase()}`}>{lead.status}</span></div>
        <div className="lead-col" data-label="Payment"><span className={`lead-payment lead-payment-${lead.paymentStatus.toLowerCase()}`}>{paymentLabel(lead.paymentStatus)}</span></div>
        <div className="lead-col" data-label="Created"><span>{when(lead.createdAt)}</span></div>
        <div className="lead-col lead-actions" data-label="Action">
          {lead.status === "NEW" ? <button type="button" onClick={() => void move(lead, "CONTACTED")}>Contacted</button> : null}
          {lead.status === "CONTACTED" ? <button type="button" onClick={() => void move(lead, "QUALIFIED")}>Qualified</button> : null}
          {lead.status === "QUALIFIED" ? <button type="button" onClick={() => void move(lead, "PROPOSAL")}>Proposal</button> : null}
          {lead.status !== "WON" ? <button type="button" className="lead-review" onClick={() => review(lead)}>Review</button> : null}
          {lead.status !== "WON" && lead.status !== "LOST" ? <button type="button" className="lead-lost" onClick={() => void move(lead, "LOST")}>Lost</button> : null}
        </div>
      </div>)}
      {!loading && visible.length === 0 ? <div className="lead-empty">No leads match the current filters.</div> : null}
    </div>

    {pageCount > 1 ? <nav className="lead-pagination" aria-label="Lead pages">
      <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Previous</button>
      <span>Page {safePage} of {pageCount}</span>
      <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next →</button>
    </nav> : null}

    <style jsx>{`
      .lead-inbox-shell{background:rgba(255,255,255,.48);border:1px solid rgba(255,255,255,.82);border-radius:26px;padding:24px;box-shadow:0 18px 50px rgba(30,76,145,.08);width:100%;min-width:0}
      .lead-inbox-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px}.lead-inbox-head h3{margin:5px 0 6px;font-size:28px}.lead-inbox-head p{margin:0;max-width:720px}
      .lead-toolbar{display:grid;grid-template-columns:minmax(260px,2fr) minmax(150px,.7fr) minmax(160px,.8fr);gap:12px;margin-bottom:16px}.lead-toolbar label{display:grid;gap:6px}.lead-toolbar label span{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.lead-toolbar input,.lead-toolbar select{width:100%;min-width:0}
      .lead-message{padding:10px 12px;border-radius:12px;background:rgba(189,255,36,.18);margin:0 0 12px}.lead-list-summary{font-size:13px;margin:8px 0 12px;color:var(--ink-soft)}
      .lead-list{border:1px solid rgba(25,66,125,.14);border-radius:18px;overflow:hidden;background:rgba(255,255,255,.5)}
      .lead-list-header,.lead-list-row{display:grid;grid-template-columns:70px minmax(190px,1.35fr) minmax(180px,1.25fr) 112px 125px 135px minmax(190px,1fr);align-items:center;gap:12px}.lead-list-header{padding:11px 14px;background:rgba(20,72,155,.08);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.lead-list-row{padding:14px;border-top:1px solid rgba(25,66,125,.1);font-size:13px}.lead-list-row:hover{background:rgba(255,255,255,.74)}
      .lead-col{min-width:0;display:grid;gap:4px}.lead-col strong,.lead-col span,.lead-col small,.lead-col a{min-width:0;overflow-wrap:anywhere}.lead-col small{color:var(--ink-soft)}.lead-customer a{font-size:12px;color:inherit;text-decoration:none}.lead-customer a:hover{text-decoration:underline}.lead-id strong{font-size:16px}
      .lead-status,.lead-payment{display:inline-flex;width:max-content;max-width:100%;align-items:center;justify-content:center;padding:6px 9px;border-radius:999px;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}.lead-status{background:#0f4fbd;color:white}.lead-status-won{background:#16764a}.lead-status-lost{background:#7d8798}.lead-status-proposal{background:#693bd5}.lead-payment{background:rgba(15,79,189,.09);color:#173c72}.lead-payment-verified{background:rgba(33,145,88,.14);color:#14663f}.lead-payment-rejected{background:rgba(184,49,49,.12);color:#9b2424}
      .lead-actions{display:flex;flex-wrap:wrap;gap:6px}.lead-actions button{border:1px solid rgba(15,79,189,.18);background:white;color:#123765;border-radius:9px;padding:7px 9px;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.lead-actions button:hover{border-color:#0f4fbd}.lead-actions .lead-review{background:#baff26;border-color:#baff26;color:#0d2a54}.lead-actions .lead-lost{color:#8f3030}
      .lead-empty{padding:30px;text-align:center}.lead-pagination{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:16px}.lead-pagination button{border:1px solid rgba(15,79,189,.18);background:white;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer}.lead-pagination button:disabled{opacity:.4;cursor:not-allowed}.lead-pagination span{font-size:12px;font-weight:800}
      @media(max-width:1100px){.lead-list-header{display:none}.lead-list{border:0;background:transparent;display:grid;gap:10px}.lead-list-row{grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid rgba(25,66,125,.12);border-radius:16px;background:rgba(255,255,255,.56);gap:12px}.lead-col{padding-top:18px;position:relative}.lead-col:before{content:attr(data-label);position:absolute;top:0;left:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft)}.lead-actions{grid-column:1/-1;padding-top:22px}}
      @media(max-width:700px){.lead-inbox-shell{padding:16px;border-radius:20px}.lead-inbox-head{display:grid}.lead-inbox-head .button{width:max-content}.lead-toolbar{grid-template-columns:1fr}.lead-list-row{grid-template-columns:1fr;padding:13px}.lead-actions{grid-column:auto}.lead-actions button{flex:1 1 auto}.lead-pagination{justify-content:space-between}.lead-pagination span{order:-1;width:100%;text-align:center}.lead-pagination{flex-wrap:wrap}.lead-pagination button{flex:1}.lead-inbox-head h3{font-size:24px}}
    `}</style>
  </div>;
}
