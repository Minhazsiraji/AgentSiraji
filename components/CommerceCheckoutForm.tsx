"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CommercePlan, Market } from "@/lib/catalog";
import type { CheckoutRoute, PaymentProvider } from "@/lib/billing";

type Props = {
  plans: CommercePlan[];
  routes: CheckoutRoute[];
  initialPlan: CommercePlan["id"];
};

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
  status?: string;
  activationRule?: string;
};

export function CommerceCheckoutForm({ plans, routes, initialPlan }: Props) {
  const [plan, setPlan] = useState<CommercePlan["id"]>(initialPlan);
  const [market, setMarket] = useState<Market>("bd");
  const allowedRoutes = useMemo(() => routes.filter((route) => route.market === market), [routes, market]);
  const [provider, setProvider] = useState<PaymentProvider>("sslcommerz");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const selectedPlan = plans.find((item) => item.id === plan) ?? plans[0];
  const providerIsAllowed = allowedRoutes.some((route) => route.provider === provider);
  const effectiveProvider = providerIsAllowed ? provider : allowedRoutes[0]?.provider;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveProvider) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, market, provider: effectiveProvider }),
      });
   const payload = (await response.json()) as CheckoutResult;

if (response.ok && payload.redirectUrl) {
  window.location.assign(payload.redirectUrl);
  return;
}

setResult(payload);
    } catch {
      setResult({ error: "The test checkout could not be reached." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="product-card lead-card" onSubmit={submit}>
      <div className="card-top">
        <span className="status">Safe test flow</span>
        <span className="card-num">01</span>
      </div>
      <div className="product-copy">
        <span className="product-label">Commerce checkout simulator</span>
        <h3>{selectedPlan.name}</h3>

        <label>
          <strong>Plan</strong><br />
          <select value={plan} onChange={(event) => setPlan(event.target.value as CommercePlan["id"])}>
            {plans.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label>
          <strong>Market</strong><br />
          <select
            value={market}
            onChange={(event) => {
              const nextMarket = event.target.value as Market;
              setMarket(nextMarket);
              setProvider(nextMarket === "bd" ? "sslcommerz" : "paddle");
              setResult(null);
            }}
          >
            <option value="bd">Bangladesh</option>
            <option value="international">International</option>
          </select>
        </label>

        <label>
          <strong>Payment method</strong><br />
          <select value={effectiveProvider} onChange={(event) => setProvider(event.target.value as PaymentProvider)}>
            {allowedRoutes.map((route) => <option value={route.provider} key={route.provider}>{route.label}</option>)}
          </select>
        </label>

        <p>
          <strong>Price:</strong> {selectedPlan.setup[market]} setup + {selectedPlan.monthly[market]}
        </p>

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Checking…" : "Run test checkout →"}
        </button>

        {result && (
          <div aria-live="polite">
            {result.error ? (
              <p><strong>Blocked:</strong> {result.error}</p>
            ) : (
              <>
                <p><strong>Test status:</strong> {result.status}</p>
                <p><strong>Activation rule:</strong> {result.activationRule}</p>
                <p>No live payment or subscription is created by this simulator.</p>
              </>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
