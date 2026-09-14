"use client";

import { FormEvent, useState } from "react";

const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
const paymentStatuses = ["NOT_APPLICABLE", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"] as const;

type BkashConfig = { configured?: boolean; method?: string; number?: string; instruction?: string; message?: string; error?: string };

export function LeadStatusReviewForm() {
  const [leadId, setLeadId] = useState("");
  const [status, setStatus] = useState<(typeof leadStatuses)[number]>("NEW");
  const [paymentStatus, setPaymentStatus] = useState<(typeof paymentStatuses)[number]>("NOT_APPLICABLE");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [verifiedAmount, setVerifiedAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentSenderHint, setPaymentSenderHint] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentVerificationNote, setPaymentVerificationNote] = useState("");
  const [ownerNote, setOwnerNote] = useState("");
  const [bkashConfig, setBkashConfig] = useState<BkashConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadBkashConfig() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/bkash-pilot", { cache: "no-store" });
      const data = await response.json() as BkashConfig;
      if (!response.ok) throw new Error(data.error || "Unable to load bKash configuration.");
      setBkashConfig(data);
      setMessage(data.configured ? "bKash pilot receiving number loaded for this authenticated owner session." : (data.message || "bKash pilot number is not configured."));
    } catch (error) {
      setBkashConfig(null);
      setMessage(error instanceof Error ? error.message : "Unable to load bKash configuration.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: leadId.trim(), status, paymentStatus,
          paymentMethod: paymentStatus === "NOT_APPLICABLE" ? null : "BKASH_SEND_MONEY",
          paymentExpectedAmount: expectedAmount || null,
          paymentVerifiedAmount: verifiedAmount || null,
          paymentReference: paymentReference.trim() || null,
          paymentSenderHint: paymentSenderHint.trim() || null,
          paymentDate: paymentDate || null,
          paymentVerificationNote: paymentVerificationNote.trim() || null,
          ownerNote: ownerNote.trim() || null,
        }),
      });
      const data = await response.json() as { error?: string; id?: string; status?: string; paymentStatus?: string };
      if (!response.ok) throw new Error(data.error || "Unable to update lead.");
      setMessage(`Lead #${data.id || leadId} saved: ${data.status || status}, payment ${data.paymentStatus || paymentStatus}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update lead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="product-card diary-card" onSubmit={submit}>
      <div className="card-top"><span className="status">bKash pilot</span><span className="card-num">02</span></div>
      <div className="product-copy">
        <span className="product-label">Authenticated owner payment review</span>
        <h3>Update lead &amp; verify bKash</h3>
        <p>This console now relies on your signed-in platform role. Customer submission never activates service; only an authenticated owner/admin can verify receipt.</p>
        <label><strong>Lead ID</strong><br /><input required inputMode="numeric" pattern="[0-9]+" value={leadId} onChange={(event) => setLeadId(event.target.value)} placeholder="e.g. 12" /></label>
        <button className="button button-primary" type="button" disabled={loading} onClick={loadBkashConfig}>{loading ? "Loading…" : "Load bKash receiving number →"}</button>
        {bkashConfig?.configured && bkashConfig.number ? <div className="form-message sent"><strong>{bkashConfig.method || "bKash Send Money"}:</strong> {bkashConfig.number}<br /><span>{bkashConfig.instruction}</span></div> : null}
        <label><strong>Lead status</strong><br /><select value={status} onChange={(event) => setStatus(event.target.value as (typeof leadStatuses)[number])}>{leadStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><strong>Payment status</strong><br /><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as (typeof paymentStatuses)[number])}>{paymentStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <div className="form-row">
          <label><strong>Expected amount (BDT)</strong><input type="number" min="1" step="0.01" value={expectedAmount} onChange={(event) => setExpectedAmount(event.target.value)} placeholder="31890" /></label>
          <label><strong>Verified amount (BDT)</strong><input type="number" min="1" step="0.01" value={verifiedAmount} onChange={(event) => setVerifiedAmount(event.target.value)} placeholder="Enter after checking bKash" /></label>
        </div>
        <div className="form-row">
          <label><strong>bKash transaction ID</strong><input maxLength={160} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Verified transaction ID" /></label>
          <label><strong>Sender hint</strong><input maxLength={40} value={paymentSenderHint} onChange={(event) => setPaymentSenderHint(event.target.value)} placeholder="e.g. last 4 digits only" /></label>
        </div>
        <label><strong>Payment date</strong><br /><input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></label>
        <label><strong>Verification note</strong><br /><textarea maxLength={1000} rows={3} value={paymentVerificationNote} onChange={(event) => setPaymentVerificationNote(event.target.value)} placeholder="How receipt was checked; required when rejecting" /></label>
        <label><strong>Owner sales note</strong><br /><textarea maxLength={2000} rows={4} value={ownerNote} onChange={(event) => setOwnerNote(event.target.value)} placeholder="Follow-up, package, onboarding and next action" /></label>
        <p><strong>Rule:</strong> WON is accepted only when payment status is VERIFIED, and VERIFIED requires the exact expected amount, transaction ID and payment date.</p>
        <button className="button button-primary" disabled={loading}>{loading ? "Saving…" : "Save & verify →"}</button>
        {message ? <p role="status">{message}</p> : null}
      </div>
    </form>
  );
}
