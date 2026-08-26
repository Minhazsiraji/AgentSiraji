"use client";

import Link from "next/link";
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
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
};

function money(amount: number | null | undefined, currency: string | undefined) {
  if (amount == null || !currency) return "—";
  if (currency === "USD") return `$${(amount / 100).toFixed(2)}`;
  return `${amount.toLocaleString()} ${currency}`;
}

function date(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function providerLabel(provider: string | undefined) {
  if (provider === "sslcommerz") return "SSLCOMMERZ";
  if (provider === "paddle") return "Paddle";
  return provider ?? "—";
}

function stateClass(value: string | null | undefined) {
  if (value === "ACTIVE" || value === "PAID") return "is-good";
  if (value === "PENDING" || value === "PENDING_PAYMENT" || value === "UNDER_REVIEW") return "is-waiting";
  return "is-neutral";
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
    return <div className="product-card lead-card account-state-card"><div className="product-copy"><span className="product-label">Commerce account</span><h3>Loading your purchase…</h3><p>Checking the verified payment and activation state.</p></div></div>;
  }

  if (!status || status.error) {
    return <div className="product-card lead-card account-state-card"><div className="product-copy"><span className="product-label">Commerce account</span><h3>We could not load this purchase.</h3><p>{status?.error ?? "Unknown account status."}</p><Link className="button button-primary" href="/contact">Contact support →</Link></div></div>;
  }

  const active = status.paymentStatus === "PAID" && status.subscriptionStatus === "ACTIVE" && status.entitlementStatus === "ACTIVE";
  const billingMessage = status.currentPeriodEnd
    ? `${status.cancelAtPeriodEnd ? "Access scheduled through" : "Current billing period ends"} ${date(status.currentPeriodEnd)}`
    : status.billingInterval
      ? `${status.billingInterval.toLowerCase()} managed service`
      : "Billing schedule will appear when available.";

  return (
    <div className="commerce-account-view">
      <section className={`account-activation-banner ${active ? "is-active" : ""}`}>
        <div>
          <span className="product-label">Commerce access</span>
          <h2>{active ? "Your Commerce service is active." : "Your Commerce activation is not complete yet."}</h2>
          <p>{active ? "Your verified payment, subscription, and product access are all active." : "This page reflects the latest verified commercial state. Access is never granted from a browser success message alone."}</p>
        </div>
        <span className="account-status-pill">{active ? "ACTIVE" : "CHECK STATUS"}</span>
      </section>

      <div className="account-summary-grid">
        <article className="product-card lead-card account-detail-card">
          <div className="card-top"><span className="status">Your package</span><span className="card-num">01</span></div>
          <div className="product-copy">
            <span className="product-label">AgentSiraji Commerce</span>
            <h3>{status.planName ?? status.planCode ?? "Commerce"}</h3>
            <div className="account-detail-list">
              <div><span>Total paid</span><strong>{money(status.amount, status.currency)}</strong></div>
              <div><span>Setup fee</span><strong>{money(status.setupAmount, status.currency)}</strong></div>
              <div><span>Monthly service</span><strong>{money(status.recurringAmount, status.currency)}</strong></div>
              <div><span>Payment provider</span><strong>{providerLabel(status.provider)}</strong></div>
              <div><span>Paid on</span><strong>{date(status.paidAt)}</strong></div>
            </div>
          </div>
        </article>

        <article className="product-card diary-card account-detail-card">
          <div className="card-top"><span className="status">Account status</span><span className="card-num">02</span></div>
          <div className="product-copy">
            <span className="product-label">Activation</span>
            <h3>{active ? "Ready to move" : "Activation pending"}</h3>
            <div className="account-status-stack">
              <div><span>Payment</span><strong className={stateClass(status.paymentStatus)}>{status.paymentStatus}</strong></div>
              <div><span>Subscription</span><strong className={stateClass(status.subscriptionStatus)}>{status.subscriptionStatus ?? "Not active"}</strong></div>
              <div><span>Access</span><strong className={stateClass(status.entitlementStatus)}>{status.entitlementStatus ?? "Not active"}</strong></div>
            </div>
            <p className="account-billing-note">{billingMessage}</p>
          </div>
        </article>
      </div>

      <section className="account-reference-card">
        <div>
          <span className="product-label">Payment reference</span>
          <strong>{status.transactionId}</strong>
          <p>Keep this reference for payment or support enquiries.</p>
        </div>
        <div className="account-actions">
          <Link className="button button-primary" href="/products/commerce">View Commerce plans →</Link>
          <Link className="button account-secondary-button" href="/contact">Contact support →</Link>
        </div>
      </section>
    </div>
  );
}
