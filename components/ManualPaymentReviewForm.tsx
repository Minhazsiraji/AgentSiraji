"use client";

import { FormEvent, useState } from "react";

type ReviewDecision = "APPROVED" | "REJECTED" | "NEEDS_INFORMATION";

type ReviewResult = {
  ok?: boolean;
  error?: string;
  paymentId?: string;
  paymentStatus?: string;
  subscriptionStatus?: string;
  entitlementStatus?: string | null;
};

export function ManualPaymentReviewForm() {
  const [paymentId, setPaymentId] = useState("");
  const [decision, setDecision] = useState<ReviewDecision | "">("");
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/commercial-payments/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentId: paymentId.trim(), decision, reviewNote: reviewNote.trim() || null }),
      });
      const payload = (await response.json()) as ReviewResult;
      setResult(payload);
      if (response.ok) setDecision("");
    } catch {
      setResult({ error: "The manual-payment review request could not be reached." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="product-card lead-card" onSubmit={submit}>
      <div className="card-top"><span className="status">Authenticated review</span><span className="card-num">01</span></div>
      <div className="product-copy">
        <span className="product-label">Commercial payment decision</span>
        <h3>Review one payment</h3>
        <p>The reviewer identity now comes from the signed-in platform account and is written into the review audit trail.</p>
        <label><strong>Payment ID</strong><br /><input required value={paymentId} onChange={(event) => setPaymentId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" /></label>
        <label><strong>Decision</strong><br /><select required value={decision} onChange={(event) => setDecision(event.target.value as ReviewDecision | "")}><option value="" disabled>Select a decision</option><option value="APPROVED">Approve</option><option value="REJECTED">Reject</option><option value="NEEDS_INFORMATION">Need more information</option></select></label>
        <label><strong>Review note</strong><br /><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Optional review note" rows={4} /></label>
        <button className="button button-primary" type="submit" disabled={loading || !decision}>{loading ? "Reviewing…" : "Submit review →"}</button>
        {result ? <div aria-live="polite">{result.error ? <p><strong>Blocked:</strong> {result.error}</p> : <><p><strong>Payment:</strong> {result.paymentStatus}</p><p><strong>Subscription:</strong> {result.subscriptionStatus}</p><p><strong>Entitlement:</strong> {result.entitlementStatus ?? "Not active"}</p></>}</div> : null}
      </div>
    </form>
  );
}
