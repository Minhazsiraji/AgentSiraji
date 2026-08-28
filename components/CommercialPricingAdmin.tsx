"use client";

import { FormEvent, useState } from "react";

type Offer = {
  id?: string;
  planCode: string;
  planName: string;
  market: "BD" | "INTL" | "EMERGING";
  currency: string;
  regularPrice: number | null;
  offerPrice: number | null;
  annualPrice: number | null;
  billingUnit: string;
  offerUnitLabel: string | null;
  offerEnabled: boolean;
  offerStartsAt: string | null;
  offerEndsAt: string | null;
  salesEnabled: boolean;
  usageLimits: Record<string, unknown>;
  sortOrder: number;
};

type Product = { code: string; name: string; status: string; offers: Offer[] };

const blankOffer: Offer = {
  planCode: "pro",
  planName: "Pro",
  market: "BD",
  currency: "BDT",
  regularPrice: null,
  offerPrice: null,
  annualPrice: null,
  billingUnit: "month",
  offerUnitLabel: null,
  offerEnabled: false,
  offerStartsAt: null,
  offerEndsAt: null,
  salesEnabled: false,
  usageLimits: {},
  sortOrder: 10,
};

function toLocalDate(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

export function CommercialPricingAdmin() {
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "saving" | "error">("idle");
  const [message, setMessage] = useState("Enter the admin token to load commercial configuration.");

  async function load() {
    setState("loading");
    setMessage("Loading products and pricing…");
    const response = await fetch("/api/admin/commercial-offers", {
      headers: { "x-agentsiraji-admin-token": token },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      setState("error");
      setMessage(data.error || "Unable to load commercial configuration.");
      return;
    }
    setProducts(data.products);
    setState("idle");
    setMessage("Loaded. Changes are saved only when you press Save pricing row.");
  }

  function updateOffer(productCode: string, index: number, patch: Partial<Offer>) {
    setProducts(current => current.map(product => product.code !== productCode ? product : {
      ...product,
      offers: product.offers.map((offer, offerIndex) => offerIndex === index ? { ...offer, ...patch } : offer),
    }));
  }

  function addOffer(productCode: string) {
    setProducts(current => current.map(product => product.code !== productCode ? product : {
      ...product,
      offers: [...product.offers, { ...blankOffer, usageLimits: {} }],
    }));
  }

  async function save(event: FormEvent, productCode: string, offer: Offer) {
    event.preventDefault();
    setState("saving");
    setMessage(`Saving ${productCode} / ${offer.planName} / ${offer.market}…`);
    const response = await fetch("/api/admin/commercial-offers", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-agentsiraji-admin-token": token },
      body: JSON.stringify({ productCode, ...offer }),
    });
    const data = await response.json();
    if (!response.ok) {
      setState("error");
      setMessage(data.error || "Unable to save pricing.");
      return;
    }
    setState("idle");
    setMessage("Saved. Display/offer configuration updated; payment-provider billing remains separate.");
    await load();
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className="glass-card" style={{ padding: 24 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <strong>Admin review token</strong>
          <input type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="Paste temporary admin token" autoComplete="off" />
        </label>
        <button className="button button-primary" type="button" onClick={load} disabled={!token || state === "loading"} style={{ marginTop: 14 }}>
          {state === "loading" ? "Loading…" : "Load products & pricing"}
        </button>
        <p className={`form-message ${state === "error" ? "error" : "sent"}`} role="status">{message}</p>
      </section>

      {products.map(product => (
        <section className="glass-card" style={{ padding: 24 }} key={product.code}>
          <div style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "start", flexWrap: "wrap" }}>
            <div>
              <span className="kicker">{product.status}</span>
              <h2 style={{ marginBottom: 4 }}>{product.name}</h2>
              <code>{product.code}</code>
            </div>
            <button className="button button-secondary" type="button" onClick={() => addOffer(product.code)}>+ Add pricing row</button>
          </div>

          {product.offers.length === 0 ? (
            <p style={{ marginTop: 18, color: "#6f7f9c" }}>No price set yet. The product is ready for pricing whenever you decide to commercialize it.</p>
          ) : null}

          <div style={{ display: "grid", gap: 18, marginTop: 20 }}>
            {product.offers.map((offer, index) => (
              <form onSubmit={event => save(event, product.code, offer)} key={`${offer.id ?? "new"}-${index}`} className="inquiry-form" style={{ borderTop: "1px solid rgba(34,76,137,.14)", paddingTop: 18 }}>
                <div className="form-row">
                  <label>Plan code<input value={offer.planCode} onChange={e => updateOffer(product.code, index, { planCode: e.target.value })} required /></label>
                  <label>Plan name<input value={offer.planName} onChange={e => updateOffer(product.code, index, { planName: e.target.value })} required /></label>
                </div>
                <div className="form-row">
                  <label>Market<select value={offer.market} onChange={e => updateOffer(product.code, index, { market: e.target.value as Offer["market"] })}><option>BD</option><option>INTL</option><option>EMERGING</option></select></label>
                  <label>Currency<input value={offer.currency} maxLength={3} onChange={e => updateOffer(product.code, index, { currency: e.target.value.toUpperCase() })} /></label>
                </div>
                <div className="form-row">
                  <label>Regular price<input type="number" min="0" step="0.01" value={offer.regularPrice ?? ""} onChange={e => updateOffer(product.code, index, { regularPrice: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                  <label>Offer price<input type="number" min="0" step="0.01" value={offer.offerPrice ?? ""} onChange={e => updateOffer(product.code, index, { offerPrice: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                </div>
                <div className="form-row">
                  <label>Annual price<input type="number" min="0" step="0.01" value={offer.annualPrice ?? ""} onChange={e => updateOffer(product.code, index, { annualPrice: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                  <label>Billing unit<input value={offer.billingUnit} onChange={e => updateOffer(product.code, index, { billingUnit: e.target.value })} placeholder="month, year, one-time" /></label>
                </div>
                <label>Offer unit / label<input value={offer.offerUnitLabel ?? ""} onChange={e => updateOffer(product.code, index, { offerUnitLabel: e.target.value || null })} placeholder="first 3 months, launch offer, per store…" /></label>
                <div className="form-row">
                  <label>Offer starts<input type="datetime-local" value={toLocalDate(offer.offerStartsAt)} onChange={e => updateOffer(product.code, index, { offerStartsAt: e.target.value || null })} /></label>
                  <label>Offer ends<input type="datetime-local" value={toLocalDate(offer.offerEndsAt)} onChange={e => updateOffer(product.code, index, { offerEndsAt: e.target.value || null })} /></label>
                </div>
                <label>Usage / feature limits (JSON)<textarea rows={5} value={JSON.stringify(offer.usageLimits, null, 2)} onChange={e => {
                  try { updateOffer(product.code, index, { usageLimits: JSON.parse(e.target.value) }); } catch { /* keep last valid JSON */ }
                }} /></label>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <label><input type="checkbox" checked={offer.offerEnabled} onChange={e => updateOffer(product.code, index, { offerEnabled: e.target.checked })} /> Offer enabled</label>
                  <label><input type="checkbox" checked={offer.salesEnabled} onChange={e => updateOffer(product.code, index, { salesEnabled: e.target.checked })} /> Sales enabled</label>
                </div>
                <button className="button button-primary form-submit" disabled={state === "saving"}>Save pricing row</button>
              </form>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
