"use client";

import { FormEvent, useState } from "react";

const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
const paymentStatuses = ["NOT_APPLICABLE", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"] as const;

export function LeadStatusReviewForm() {
  const [leadId, setLeadId] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<(typeof leadStatuses)[number]>("NEW");
  const [paymentStatus, setPaymentStatus] = useState<(typeof paymentStatuses)[number]>("NOT_APPLICABLE");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [ownerNote, setOwnerNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-agentsiraji-admin-token": token.trim(),
        },
        body: JSON.stringify({
          id: leadId.trim(),
          status,
          paymentStatus,
          paymentMethod: paymentMethod.trim() || null,
          paymentReference: paymentReference.trim() || null,
          ownerNote: ownerNote.trim() || null,
        }),
      });
      const data = await response.json() as { error?: string; id?: string; status?: string };
      if (!response.ok) throw new Error(data.error || "Unable to update lead.");
      setMessage(`Lead #${data.id || leadId} updated to ${data.status || status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update lead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="product-card diary-card" onSubmit={submit}>
      <div className="card-top"><span className="status">Owner workflow</span><span className="card-num">02</span></div>
      <div className="product-copy">
        <span className="product-label">Sales lead follow-up</span>
        <h3>Update one lead</h3>
        <p>Use the lead ID included in the Store Audit or enquiry notification. This pilot tool does not expose a searchable customer list.</p>
        <label><strong>Lead ID</strong><br /><input required inputMode="numeric" pattern="[0-9]+" value={leadId} onChange={(event) => setLeadId(event.target.value)} placeholder="e.g. 12" /></label>
        <label><strong>Owner admin token</strong><br /><input required type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" placeholder="Owner token" /></label>
        <label><strong>Lead status</strong><br /><select value={status} onChange={(event) => setStatus(event.target.value as (typeof leadStatuses)[number])}>{leadStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><strong>Payment status</strong><br /><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as (typeof paymentStatuses)[number])}>{paymentStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><strong>Payment method</strong><br /><input maxLength={80} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="Optional manual method" /></label>
        <label><strong>Verified payment reference</strong><br /><input maxLength={160} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Only after owner verification" /></label>
        <label><strong>Owner note</strong><br /><textarea maxLength={2000} rows={4} value={ownerNote} onChange={(event) => setOwnerNote(event.target.value)} placeholder="Follow-up, qualification, proposal or next action" /></label>
        <button className="button button-primary" disabled={loading || token.trim().length < 32}>{loading ? "Saving…" : "Save lead →"}</button>
        {message ? <p role="status">{message}</p> : null}
      </div>
    </form>
  );
}
