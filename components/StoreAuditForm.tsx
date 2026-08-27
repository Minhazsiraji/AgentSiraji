"use client";

import { FormEvent, useState } from "react";

export default function StoreAuditForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/store-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to request your audit.");
      form.reset();
      setState("sent");
      setMessage("Audit request received. We’ll review the store manually and reply within 24 hours with the next steps.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to request your audit right now.");
    }
  }

  return (
    <form className="inquiry-form" onSubmit={submit}>
      <div className="form-row">
        <label>Business name<input name="businessName" required minLength={2} maxLength={100} placeholder="Your business or page name" /></label>
        <label>Country<input name="country" required minLength={2} maxLength={60} autoComplete="country-name" placeholder="Bangladesh, Nepal, Ghana…" /></label>
      </div>
      <label>Store or Facebook page URL<input name="storeUrl" required type="url" maxLength={300} placeholder="https://…" /></label>
      <div className="form-row">
        <label>Email<input name="email" required type="email" maxLength={120} autoComplete="email" placeholder="you@company.com" /></label>
        <label>WhatsApp / phone<input name="whatsapp" required minLength={7} maxLength={40} autoComplete="tel" placeholder="+880…" /></label>
      </div>
      <label>Approximate product count<select name="productCount" required defaultValue=""><option value="" disabled>Select a range</option><option>1–20</option><option>21–50</option><option>51–100</option><option>101–500</option><option>500+</option></select></label>
      <label className="honeypot" aria-hidden="true">Company website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button button-primary form-submit" disabled={state === "sending"}>{state === "sending" ? "Submitting…" : "Get my free store audit →"}</button>
      {message ? <p className={`form-message ${state}`} role="status">{message}</p> : null}
      <p style={{ fontSize: 11, color: "#6f7f9c", lineHeight: 1.5 }}>We use these details only to review your business and contact you about this audit. Never submit passwords, OTPs, card data, or private admin credentials.</p>
    </form>
  );
}
