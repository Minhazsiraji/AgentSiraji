"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CheckoutRoute, PaymentProvider } from "@/lib/billing";
import type { Market } from "@/lib/catalog";
import {
  activeDisplayPrice,
  formatCommercialPrice,
  type PublicCommercialOffer,
} from "@/lib/public-commercial";

type BillingCycle = "month" | "year";

type CheckoutResult = {
  redirectUrl?: string;
  paymentId?: string;
  transactionId?: string;
  ok?: boolean;
  error?: string;
  mode?: string;
  provider?: PaymentProvider;
  market?: Market;
  plan?: string;
  product?: string;
  billingCycle?: BillingCycle;
  status?: string;
  activationRule?: string;
  expectedAmount?: number;
  currency?: string;
  submissionId?: string;
};

type Props = {
  productCode: string;
  productName: string;
  offers: PublicCommercialOffer[];
  routes: CheckoutRoute[];
  initialPlan: string;
  initialBillingCycle?: BillingCycle;
};

function offerFor(offers: PublicCommercialOffer[], plan: string, market: Market) {
  const dbMarket = market === "bd" ? "BD" : "INTL";
  return offers.find((offer) => offer.planCode === plan && offer.market === dbMarket);
}

export function SubscriptionCheckoutForm({ productCode, productName, offers, routes, initialPlan, initialBillingCycle = "month" }: Props) {
  const planCodes = useMemo(() => [...new Set(offers.map((offer) => offer.planCode))], [offers]);
  const [plan, setPlan] = useState(initialPlan);
  const [market, setMarket] = useState<Market>("bd");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [provider, setProvider] = useState<PaymentProvider>("sslcommerz");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [phone, setPhone] = useState("");
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
  const providerIsAllowed = allowedRoutes.some((route) => route.provider === provider);
  const effectiveProvider = providerIsAllowed ? provider : allowedRoutes[0]?.provider;
  const manualProvider = effectiveProvider === "bank-transfer" || effectiveProvider === "manual-invoice";
  const selectedOffer = offerFor(offers, plan, market);

  function resetFlow() {
    setResult(null);
    setManualResult(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveProvider) return;
    setLoading(true);
    resetFlow();
    try {
      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          product: productCode,
          plan,
          market,
          billingCycle,
          provider: effectiveProvider,
          email,
          displayName,
          organizationName,
          phone,
        }),
      });
      const payload = await response.json() as CheckoutResult;
      if (response.ok && payload.redirectUrl) {
        window.location.assign(payload.redirectUrl);
        return;
      }
      setResult(payload);
    } catch {
      setResult({ error: "Subscription checkout is temporarily unavailable. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function submitManualEvidence() {
    if (!result?.paymentId || !result.expectedAmount || !effectiveProvider || !manualProvider) return;
    setManualLoading(true);
    setManualResult(null);
    try {
      const response = await fetch("/api/subscriptions/manual-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
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
    } catch {
      setManualResult({ error: "Payment evidence could not be submitted. Please try again." });
    } finally {
      setManualLoading(false);
    }
  }

  const displayExpectedAmount = result?.expectedAmount
    ? result.currency === "USD"
      ? `$${(result.expectedAmount / 100).toFixed(2)}`
      : `৳${result.expectedAmount.toLocaleString("en-BD")}`
    : null;

  const monthlyPrice = selectedOffer ? activeDisplayPrice(selectedOffer) : null;
  const selectedPrice = billingCycle === "year" ? selectedOffer?.annualPrice ?? null : monthlyPrice;
  const selectedUnit = billingCycle === "year" ? "year" : selectedOffer?.billingUnit ?? "month";

  return (
    <form className="product-card lead-card" onSubmit={submit}>
      <div className="card-top">
        <span className="status">Secure subscription checkout</span>
        <span className="card-num">02</span>
      </div>
      <div className="product-copy">
        <span className="product-label">{productName} subscription</span>
        <h3>{selectedOffer?.planName ?? plan}</h3>

        <label><strong>Plan</strong><br />
          <select value={plan} onChange={(e) => { setPlan(e.target.value); resetFlow(); }}>
            {planCodes.map((code) => {
              const offer = offers.find((item) => item.planCode === code);
              return <option value={code} key={code}>{offer?.planName ?? code}</option>;
            })}
          </select>
        </label>

        <label><strong>Billing</strong><br />
          <select value={billingCycle} onChange={(e) => { setBillingCycle(e.target.value as BillingCycle); resetFlow(); }}>
            <option value="month">Monthly</option>
            <option value="year" disabled={selectedOffer?.annualPrice == null}>Annual</option>
          </select>
        </label>

        <label><strong>Market</strong><br />
          <select value={market} onChange={(e) => {
            const next = e.target.value as Market;
            setMarket(next);
            setProvider(next === "bd" ? "sslcommerz" : "paddle");
            resetFlow();
          }}>
            <option value="bd">Bangladesh</option>
            <option value="international">International</option>
          </select>
        </label>

        <label><strong>Payment method</strong><br />
          <select value={effectiveProvider} onChange={(e) => { setProvider(e.target.value as PaymentProvider); resetFlow(); }}>
            {allowedRoutes.map((route) => <option value={route.provider} key={route.provider}>{route.label}</option>)}
          </select>
        </label>

        <label><strong>Business / organization</strong><br />
          <input value={organizationName} maxLength={160} onChange={(e) => setOrganizationName(e.target.value)} required />
        </label>
        <label><strong>Your name</strong><br />
          <input value={displayName} maxLength={120} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label><strong>Email</strong><br />
          <input type="email" value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label><strong>Phone</strong><br />
          <input value={phone} maxLength={40} onChange={(e) => setPhone(e.target.value)} placeholder={market === "bd" ? "+880..." : "+1..."} />
        </label>

        <p>
          <strong>Subscription price:</strong>{" "}
          {selectedOffer ? `${formatCommercialPrice(selectedOffer.currency, selectedPrice)} / ${selectedUnit}` : "Price not configured"}
        </p>
        {billingCycle === "month" && selectedOffer?.annualPrice != null ? (
          <p><small>Or {formatCommercialPrice(selectedOffer.currency, selectedOffer.annualPrice)} / year</small></p>
        ) : null}

        <button className="button button-primary" type="submit" disabled={loading || !selectedOffer || selectedPrice == null}>
          {loading ? "Preparing checkout…" : manualProvider ? "Create payment reference →" : "Continue to payment →"}
        </button>

        {result?.error && <p aria-live="polite"><strong>Checkout unavailable:</strong> {result.error}</p>}

        {manualProvider && result?.paymentId && !result.error && (
          <div aria-live="polite">
            <p><strong>Payment reference:</strong> {result.paymentId}</p>
            <p><strong>Expected amount:</strong> {displayExpectedAmount}</p>
            <p><strong>Verification required:</strong> submitting evidence does not activate access. AgentSiraji must verify and approve the payment.</p>

            <label><strong>{effectiveProvider === "bank-transfer" ? "Sender bank" : "Payment channel"}</strong><br />
              <input value={bankName} maxLength={120} onChange={(e) => setBankName(e.target.value)} placeholder={effectiveProvider === "bank-transfer" ? "Bank name" : "Payoneer / bank / invoice"} required />
            </label>
            <label><strong>Sender / payer name</strong><br /><input value={senderName} maxLength={120} onChange={(e) => setSenderName(e.target.value)} required /></label>
            <label><strong>Transaction / invoice reference</strong><br /><input value={reference} maxLength={160} onChange={(e) => setReference(e.target.value)} required /></label>
            <label><strong>Payment date</strong><br /><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required /></label>
            <label><strong>Proof link (optional)</strong><br /><input type="url" value={proofUrl} maxLength={1000} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://..." /></label>
            <button className="button" type="button" onClick={submitManualEvidence} disabled={manualLoading || !bankName || !senderName || !reference || !paymentDate}>
              {manualLoading ? "Submitting…" : "Submit for verification →"}
            </button>
            {manualResult?.error && <p><strong>Submission unavailable:</strong> {manualResult.error}</p>}
            {manualResult?.status === "under_review" && <p><strong>Under review.</strong> Access remains blocked until authorized approval.</p>}
          </div>
        )}

        {result && !manualProvider && !result.error && !result.redirectUrl && (
          <div aria-live="polite">
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Activation rule:</strong> {result.activationRule}</p>
          </div>
        )}
      </div>
    </form>
  );
}
