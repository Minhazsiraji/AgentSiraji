"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to send your message.");
      form.reset();
      setState("sent");
      setMessage("Thanks—your message is in. I’ll reply as soon as possible.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please email hello@agentsiraji.com.");
    }
  }

  return (
    <form className="inquiry-form" onSubmit={submit}>
      <div className="form-row"><label>Name<input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Your name" /></label><label>Email<input name="email" required type="email" maxLength={120} autoComplete="email" placeholder="you@company.com" /></label></div>
      <label>What do you need?<select name="interest" required defaultValue=""><option value="" disabled>Select a service or product</option><option>LeadPilot early access</option><option>Doctor&apos;s Diary updates</option><option>Website or product build</option><option>Automation & AI</option><option>Product strategy</option><option>Something else</option></select></label>
      <label>Tell me about it<textarea name="message" required minLength={20} maxLength={2000} rows={6} placeholder="What are you building, what is the challenge, and what would success look like?" /></label>
      <label className="honeypot" aria-hidden="true">Company website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button button-primary form-submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send inquiry →"}</button>
      {message && <p className={`form-message ${state}`} role="status">{message}</p>}
    </form>
  );
}
