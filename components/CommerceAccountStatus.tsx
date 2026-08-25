"use client";

import { useEffect, useState } from "react";

 type AccountStatus = {
  ok?: boolean;
  error?: string;
  provider?: string;
  transactionId?: string;
  planCode?: string | null;
  planName?: string | null;
  currency?: string;
  amount?: number;
  setupAmount?: number | null;
  recurringAmount?: number | null;
  billingInterval?: string | null;
  paymentStatus?: string;
  subscriptionStatus?: string | null;
  entitlementStatus?: string | null;
  paidAt?: string | null;
};

function money(amount: number | null | undefined, currency: string | undefined) {
  if (amount == null || !currency) return "—";
  if (currency === "USD") return `$${(amount / 100).toFixed(2)}`;
  return `${amount.toLocaleString()} ${currency}`;
}

export function CommerceAccountStatus({ provider, transactionId }: { provider: "paddle" | "sslcommerz"; transactionId: string }) {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/account/commerce/transaction?provider=${encodeURIComponent(provider)}&transactionId=${encodeURIComponent(transactionId)}`, { cache: "no-store" });
        const payload = await response.json() as AccountStatus;
        if (active) setStatus(payload);
      } catch {
        if (active) setStatus({ error: "Your Commerce account status could not be loaded." });
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [provider, transactionId]);

  if (loading) {
    return <div className="product-card lead-card"><div className="product-copy"><h3>Loading your Commerce account…</h3></div></div>;
  }

  if (!status || status.error) {
    return <div className="product-card lead-card"><div className="product-copy"><span className="product-label">Account status</span><h3>We could not load this purchase.</h3><p>{status?.error ?? "Unknown account status."}</p></div></div>;
  }

  const active = status.paymentStatus === "PAID" && status.subscriptionStatus === "ACTIVE" && status.entitlementStatus === "ACTIVE";

  return (
    <div className="product-grid">
      <article className="product-card lead-card">
        <div className="card-top"><span className="status">Your package</span><span className="card-num">01</span></div>
        <div className="product-copy">
          <span className="product-label">AgentSiraji Commerce</span>
          <h3>{status.planName ?? status.planCode ?? "Commerce"}</h3>
          <p><strong>Total paid:</strong> {money(status.amount, status.currency)}</p>
          <p><strong>Setup:</strong> {money(status.setupAmount, status.currency)}</p>
          <p><strong>Monthly:</strong> {money(status.recurringAmount, status.currency)}</p>
          <p><strong>Billing:</strong> {status.billingInterval ?? "—"}</p>
        </div>
      </article>

      <article className="product-card diary-card">
        <div className="card-top"><span className="status">Account status</span><span className="card-num">02</span></div>
        <div className="product-copy">
          <span className="product-label">Activation</span>
          <h3>{active ? "Commerce is active" : "Activation pending"}</h3>
          <p><strong>Payment:</strong> {status.paymentStatus}</p>
          <p><strong>Subscription:</strong> {status.subscriptionStatus ?? "Not active"}</p>
          <p><strong>Access:</strong> {status.entitlementStatus ?? "Not active"}</p>
          <p><strong>Transaction:</strong> {status.transactionId}</p>
        </div>
      </article>
    </div>
  );
}
