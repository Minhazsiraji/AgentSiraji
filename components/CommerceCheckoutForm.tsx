"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CommercePlan, Market } from "@/lib/catalog";
import type { CheckoutRoute, PaymentProvider } from "@/lib/billing";

type Props = { plans: CommercePlan[]; routes: CheckoutRoute[]; initialPlan: CommercePlan["id"] };
type CheckoutResult = {
  redirectUrl?: string; paymentId?: string; transactionId?: string; ok?: boolean; error?: string;
  mode?: string; provider?: PaymentProvider; market?: Market; plan?: string; status?: string;
  activationRule?: string; expectedAmount?: number; currency?: string; submissionId?: string;
};

export function CommerceCheckoutForm({ plans, routes, initialPlan }: Props) {
  const [plan, setPlan] = useState<CommercePlan["id"]>(initialPlan);
  const [market, setMarket] = useState<Market>("bd");
  const [provider, setProvider] = useState<PaymentProvider>("sslcommerz");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<CheckoutResult | null>(null);
  const [bankName, setBankName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const allowedRoutes = useMemo(() => routes.filter((route) => route.market === market), [routes, market]);
  const selectedPlan = plans.find((item) => item.id === plan) ?? plans[0];
  const providerIsAllowed = allowedRoutes.some((route) => route.provider === provider);
  const effectiveProvider = providerIsAllowed ? provider : allowedRoutes[0]?.provider;
  const manualProvider = effectiveProvider === "bank-transfer" || effectiveProvider === "manual-invoice";

  function resetFlow() { setResult(null); setManualResult(null); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveProvider) return;
    setLoading(true); resetFlow();
    try {
      const response = await fetch("/api/commerce/checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, market, provider: effectiveProvider }),
      });
      const payload = await response.json() as CheckoutResult;
      if (response.ok && payload.redirectUrl) { window.location.assign(payload.redirectUrl); return; }
      setResult(payload);
    } catch { setResult({ error: "The checkout could not be reached." }); }
    finally { setLoading(false); }
  }

  async function submitManualEvidence() {
    if (!result?.paymentId || !result.expectedAmount || !effectiveProvider || !manualProvider) return;
    setManualLoading(true); setManualResult(null);
    try {
      const response = await fetch("/api/commerce/manual-bank", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paymentId: result.paymentId,
          provider: effectiveProvider,
          bankName: bankName || (effectiveProvider === "manual-invoice" ? "Manual invoice / Payoneer" : ""),
          senderName,
          transactionReference: reference,
          amount: result.expectedAmount,
          paymentDate,
          proofUrl: proofUrl || null,
        }),
      });
      setManualResult(await response.json() as CheckoutResult);
    } catch { setManualResult({ error: "The payment evidence could not be submitted." }); }
    finally { setManualLoading(false); }
  }

  const displayExpectedAmount = result?.expectedAmount
    ? result.currency === "USD" ? `$${(result.expectedAmount / 100).toFixed(2)}` : `${result.expectedAmount} ${result.currency ?? ""}`
    : null;

  return (
    <form className="product-card lead-card" onSubmit={submit}>
      <div className="card-top"><span className="status">Safe test flow</span><span className="card-num">01</span></div>
      <div className="product-copy">
        <span className="product-label">Commerce checkout simulator</span>
        <h3>{selectedPlan.name}</h3>

        <label><strong>Plan</strong><br />
          <select value={plan} onChange={(e) => { setPlan(e.target.value as CommercePlan["id"]); resetFlow(); }}>
            {plans.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label><strong>Market</strong><br />
          <select value={market} onChange={(e) => {
            const next = e.target.value as Market; setMarket(next); setProvider(next === "bd" ? "sslcommerz" : "paddle"); resetFlow();
          }}>
            <option value="bd">Bangladesh</option><option value="international">International</option>
          </select>
        </label>

        <label><strong>Payment method</strong><br />
          <select value={effectiveProvider} onChange={(e) => { setProvider(e.target.value as PaymentProvider); resetFlow(); }}>
            {allowedRoutes.map((route) => <option value={route.provider} key={route.provider}>{route.label}</option>)}
          </select>
        </label>

        <p><strong>Price:</strong> {selectedPlan.setup[market]} setup + {selectedPlan.monthly[market]}</p>
        <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Creating…" : manualProvider ? "Create payment reference →" : "Continue to payment →"}</button>

        {result?.error && <p aria-live="polite"><strong>Blocked:</strong> {result.error}</p>}

        {manualProvider && result?.paymentId && !result.error && (
          <div aria-live="polite">
            <p><strong>Payment reference:</strong> {result.paymentId}</p>
            <p><strong>Expected amount:</strong> {displayExpectedAmount}</p>
            <p><strong>Important:</strong> submitting evidence does not activate the service. It only creates an admin review.</p>

            <label><strong>{effectiveProvider === "bank-transfer" ? "Sender bank" : "Payment channel"}</strong><br />
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={effectiveProvider === "bank-transfer" ? "Bank name" : "Payoneer / bank / invoice"} required />
            </label>
            <label><strong>Sender / payer name</strong><br /><input value={senderName} onChange={(e) => setSenderName(e.target.value)} required /></label>
            <label><strong>Transaction / invoice reference</strong><br /><input value={reference} onChange={(e) => setReference(e.target.value)} required /></label>
            <label><strong>Payment date</strong><br /><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required /></label>
            <label><strong>Proof link (optional)</strong><br /><input type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://..." /></label>
            <button className="button" type="button" onClick={submitManualEvidence} disabled={manualLoading || !bankName || !senderName || !reference || !paymentDate}>
              {manualLoading ? "Submitting…" : "Submit for verification →"}
            </button>

            {manualResult?.error && <p><strong>Submission blocked:</strong> {manualResult.error}</p>}
            {manualResult?.status === "under_review" && <p><strong>Under review.</strong> Payment evidence is saved, but access remains blocked until authorized approval.</p>}
          </div>
        )}

        {result && !manualProvider && !result.error && !result.redirectUrl && (
          <div aria-live="polite"><p><strong>Status:</strong> {result.status}</p><p><strong>Activation rule:</strong> {result.activationRule}</p></div>
        )}
      </div>
    </form>
  );
}
