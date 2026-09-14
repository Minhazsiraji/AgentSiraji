"use client";

import { FormEvent, useState } from "react";
import type { CommercePlan } from "@/lib/catalog";
import { createMetaEventId, getMetaBrowserIdentifiers, hasMarketingConsent } from "@/lib/meta-client";

type ResponseBody = { ok?: boolean; leadId?: string; message?: string };

type Props = {
  plans: CommercePlan[];
  initialPlan: CommercePlan["id"];
};

export function CommercePlanIntentForm({ plans, initialPlan }: Props) {
  const [plan, setPlan] = useState<CommercePlan["id"]>(initialPlan);
  const [market, setMarket] = useState<"bd" | "international">("bd");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const selected = plans.find((item) => item.id === plan) ?? plans[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("");
    const form = event.currentTarget;
    const marketingConsent = hasMarketingConsent();
    const metaEventId = marketingConsent ? createMetaEventId("commerce_plan_intent") : undefined;
    const metaIdentifiers = marketingConsent ? getMetaBrowserIdentifiers() : { fbp: undefined, fbc: undefined };
    const payload = {
      ...Object.fromEntries(new FormData(form)),
      plan,
      market,
      marketingConsent,
      metaEventId,
      ...metaIdentifiers,
    };

    try {
      const response = await fetch("/api/commerce/order-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const data = await response.json() as ResponseBody;
      if (!response.ok) throw new Error(data.message || "Unable to save your plan request.");
      if (data.leadId) window.dispatchEvent(new CustomEvent("agentsiraji:commerce-intent-saved", { detail: { eventId: metaEventId, plan, market } }));
      form.reset();
      setState("sent");
      setMessage(data.message || "Your plan request is saved. AgentSiraji will contact you before any payment is requested.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to save your request.");
    }
  }

  const price = market === "bd"
    ? `${selected.setup.bd} setup + ${selected.monthly.bd}`
    : `${selected.setup.international} setup + ${selected.monthly.international}`;

  return (
    <form className="inquiry-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          Commerce plan
          <select value={plan} onChange={(event) => setPlan(event.target.value as CommercePlan["id"])}>
            {plans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          Market
          <select name="market" value={market} onChange={(event) => setMarket(event.target.value as "bd" | "international")}>
            <option value="bd">Bangladesh</option>
            <option value="international">International</option>
          </select>
        </label>
      </div>

      <div className="form-message sent" role="note">
        <strong>{selected.name}:</strong> {price}. Submitting this form does not charge you. AgentSiraji confirms scope and payment instructions first.
      </div>

      <div className="form-row">
        <label>Business name<input name="businessName" required minLength={2} maxLength={100} autoComplete="organization" placeholder="Your business or page name" /></label>
        <label>Your name<input name="contactName" required minLength={2} maxLength={80} autoComplete="name" placeholder="Your name" /></label>
      </div>
      <div className="form-row">
        <label>Email<input name="email" required type="email" maxLength={120} autoComplete="email" placeholder="you@company.com" /></label>
        <label>WhatsApp / phone<input name="phone" required minLength={7} maxLength={40} autoComplete="tel" placeholder="+8801XXXXXXXXX" /></label>
      </div>
      <div className="form-row">
        <label>Country<input name="country" required minLength={2} maxLength={60} autoComplete="country-name" defaultValue="Bangladesh" placeholder="Bangladesh" /></label>
        <label>Store / Facebook / Instagram URL <span style={{ fontWeight: 400 }}>(optional)</span><input name="storeUrl" type="url" maxLength={300} placeholder="https://…" /></label>
      </div>
      <label>
        Current selling setup
        <select name="sellingChannel" required defaultValue="">
          <option value="" disabled>Select the main channel</option>
          <option>Facebook / Messenger</option>
          <option>Instagram</option>
          <option>WhatsApp</option>
          <option>Existing website</option>
          <option>Marketplace</option>
          <option>Other</option>
        </select>
      </label>
      <label>Anything we should know? <span style={{ fontWeight: 400 }}>(optional)</span><textarea name="notes" maxLength={1200} rows={4} placeholder="Products, timeline, current problem, or anything important for onboarding." /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button button-primary form-submit" disabled={state === "sending" || state === "sent"}>
        {state === "sending" ? "Saving request…" : state === "sent" ? "Request saved ✓" : `Start ${selected.name} →`}
      </button>
      <p style={{ color: "#5d7090", fontSize: 13, margin: 0 }}>No payment is taken on this page. During the Bangladesh pilot, AgentSiraji confirms the project first and sends the verified bKash payment instruction only when you are ready to proceed.</p>
      {message && <p className={`form-message ${state}`} role="status">{message}</p>}
      {state === "error" && <a className="form-fallback" href="mailto:info@agentsiraji.com?subject=AgentSiraji%20Commerce%20plan%20request">Continue by email →</a>}
    </form>
  );
}
