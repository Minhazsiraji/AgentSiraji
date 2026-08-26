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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to send your message.");
      form.reset();
      setState("sent");
      setMessage("Thanks—your message is in. We’ll reply as soon as possible.");
    } catch (error) {
      setState("error");
      const fallback = error instanceof Error ? error.message : "Something went wrong.";
      setMessage(`${fallback} You can use the email link below instead.`);
    }
  }

  return (
    <form className="inquiry-form" onSubmit={submit}>
      <div className="form-row">
        <label>Name<input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Your name" /></label>
        <label>Email<input name="email" required type="email" maxLength={120} autoComplete="email" placeholder="you@company.com" /></label>
      </div>
      <label>
        What do you need?
        <select name="interest" required defaultValue="">
          <option value="" disabled>Select a product or topic</option>
          <option>Commerce sales</option>
          <option>LeadPilot early access</option>
          <option>AdIntel early access</option>
          <option>Doctor&apos;s Diary updates</option>
          <option>Business License enquiry</option>
          <option>Partnership or other enquiry</option>
        </select>
      </label>
      <label>Tell us about it<textarea name="message" required minLength={20} maxLength={2000} rows={6} placeholder="What does your business need, what is the challenge, and what would success look like?" /></label>
      <label className="honeypot" aria-hidden="true">Company website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button button-primary form-submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send inquiry →"}</button>
      {message && <p className={`form-message ${state}`} role="status">{message}</p>}
      {state === "error" && <a className="form-fallback" href="mailto:hello@agentsiraji.com?subject=AgentSiraji inquiry">Continue by email →</a>}
    </form>
  );
}
