"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Result = {
  error?: string;
  account?: { email: string; displayName: string | null };
  organizations?: Array<{ organizationId: string; organizationName: string; planName: string | null; paymentStatus: string | null; subscriptionStatus: string | null; entitlementStatus: string | null }>;
};

export function SecureCommerceAccount() {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    fetch("/api/account/commerce", { cache: "no-store" })
      .then(response => response.json())
      .then(setResult)
      .catch(() => setResult({ error: "Account status could not be loaded." }));
  }, []);

  if (!result) return <p>Loading your secure account…</p>;
  if (result.error === "Sign in is required.") return <p><Link href="/sign-in?next=/account/commerce">Sign in securely →</Link></p>;
  if (result.error) return <p>{result.error}</p>;

  return <div style={{ display: "grid", gap: 18 }}>
    <div><strong>{result.account?.displayName || result.account?.email}</strong><p>Only organizations linked to this signed-in account are shown.</p></div>
    {(result.organizations || []).map(org => <article key={org.organizationId} className="product-card lead-card">
      <div className="product-copy"><span className="product-label">{org.organizationName}</span><h3>{org.planName || "AgentSiraji Commerce"}</h3><p>Payment: {org.paymentStatus || "—"} · Subscription: {org.subscriptionStatus || "—"} · Access: {org.entitlementStatus || "—"}</p></div>
    </article>)}
  </div>;
}
