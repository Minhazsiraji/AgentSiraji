"use client";

import { FormEvent, useState } from "react";
import styles from "./StoreAuditResult.module.css";

type AuditResult = {
  version: "v2";
  mode: "automated-preliminary";
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  scannedUrl: string;
  scannedAt: string;
  categories: Array<{
    key: string;
    name: string;
    score: number;
    status: "strong" | "needs-work" | "weak";
    summary: string;
    checks: string[];
  }>;
  limitations: string[];
};

type AuditResponse = {
  ok?: boolean;
  result?: AuditResult | null;
  manualReview?: boolean;
  notificationDelivered?: boolean;
  message?: string;
};

export default function StoreAuditForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("Analyzing the public store page. This can take a few seconds…");
    setResult(null);
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/store-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as AuditResponse;
      if (!response.ok) throw new Error(data.message || "Unable to request your audit.");
      if (data.result) setResult(data.result);
      setState("sent");
      setMessage(data.message || "Audit request received.");
      if (data.result) form.reset();
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
      <button className="button button-primary form-submit" disabled={state === "sending"}>{state === "sending" ? "Analyzing store…" : "Get my free store audit →"}</button>
      {message ? <p className={`form-message ${state}`} role="status">{message}</p> : null}
      {result ? (
        <section className={styles.result} aria-label="Automated preliminary store audit result">
          <div className={styles.top}>
            <div>
              <span className={styles.eyebrow}>Store Audit V2 · preliminary result</span>
              <h3 className={styles.title}>Your automated store score</h3>
            </div>
            <div className={styles.score} aria-label={`${result.overallScore} out of 100, grade ${result.grade}`}>
              <div>{result.overallScore}<small>/100</small><span className={styles.grade}>Grade {result.grade}</span></div>
            </div>
          </div>
          <p className={styles.message}>Scanned: {result.scannedUrl}. This score is generated from public, observable signals and should be confirmed by the human review.</p>
          <div className={styles.categories}>
            {result.categories.map((item) => (
              <div className={styles.category} key={item.key}>
                <div className={styles.row}><span className={styles.name}>{item.name}</span><span className={styles.value}>{item.score}/100</span></div>
                <div className={styles.bar} aria-hidden="true"><div className={styles.fill} style={{ width: `${item.score}%` }} /></div>
                <p className={styles.summary}>{item.summary}</p>
              </div>
            ))}
          </div>
          <div className={styles.manual}><strong>Next step:</strong> AgentSiraji&apos;s human review should verify browser performance, checkout behavior, tracking accuracy, and the commercial recommendations before this becomes a final audit.</div>
          <div className={styles.limits}><strong>Important:</strong> {result.limitations.join(" ")}</div>
        </section>
      ) : null}
      <p style={{ fontSize: 11, color: "#6f7f9c", lineHeight: 1.5 }}>We use these details only to review your business and contact you about this audit. Never submit passwords, OTPs, card data, or private admin credentials.</p>
    </form>
  );
}
