"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type ChatLink = { label: string; href: string };
type Message = {
  role: "assistant" | "user" | "moderator";
  text: string;
  links?: ChatLink[];
  handoff?: boolean;
  ticketId?: string;
};

const suggestions = ["Commerce pricing", "Payment options", "Refund rules", "Security"];

const initialMessage: Message = {
  role: "assistant",
  text: "Hi — I’m the AgentSiraji 24/7 Support Assistant mock. Ask me about Commerce, pricing, payments, refunds, privacy, security, LeadPilot, AdIntel, or Doctor’s Diary. If I’m not confident, I’ll escalate instead of guessing.",
};

export function SupportAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const latestHandoff = useMemo(
    () => [...messages].reverse().find((message) => message.handoff && message.ticketId),
    [messages],
  );

  if (pathname.startsWith("/demo/")) return null;

  async function sendMessage(value: string) {
    const text = value.trim();
    if (!text || pending) return;

    const userMessage: Message = { role: "user", text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = (await response.json()) as {
        error?: string;
        reply?: string;
        handoff?: boolean;
        ticketId?: string;
        links?: ChatLink[];
      };

      if (!response.ok || !data.reply) throw new Error(data.error || "Support request failed.");

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.reply!,
          links: data.links,
          handoff: Boolean(data.handoff),
          ticketId: data.ticketId,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I couldn’t complete that mock support request. Please try again. In the final service, repeated failures will automatically route to a moderator queue.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function simulateModerator() {
    const ticketId = latestHandoff?.ticketId ?? "MOCK-DEMO";
    setMessages((current) => [
      ...current,
      {
        role: "moderator",
        text: `Moderator mock reply for ${ticketId}: Thanks — I have the conversation context. This demonstrates the takeover step. In production, an authorized support operator would reply from the live queue.`,
      },
    ]);
  }

  return (
    <div className={`support-assistant ${open ? "is-open" : ""}`}>
      {open ? (
        <section className="support-panel" aria-label="AgentSiraji support assistant">
          <header className="support-panel-header">
            <div>
              <span className="support-status-dot" />
              <div><strong>24/7 Support Assistant</strong><small>Mock test · AI-first handoff design</small></div>
            </div>
            <button type="button" aria-label="Close support assistant" onClick={() => setOpen(false)}>×</button>
          </header>

          <div className="support-safety-note">Never share passwords, OTPs, full card numbers, CVVs, API keys, or identity documents in chat.</div>

          <div className="support-messages" aria-live="polite">
            {messages.map((message, index) => (
              <article className={`support-message ${message.role}`} key={`${message.role}-${index}-${message.ticketId ?? "chat"}`}>
                <span>{message.role === "user" ? "You" : message.role === "moderator" ? "Moderator" : "AgentSiraji AI"}</span>
                <p>{message.text}</p>
                {message.links?.length ? <div className="support-message-links">{message.links.map((link) => <Link href={link.href} key={`${index}-${link.href}`}>{link.label} →</Link>)}</div> : null}
                {message.handoff && message.ticketId ? <div className="support-handoff-card"><strong>Moderator handoff queued · mock</strong><small>Reference {message.ticketId}</small></div> : null}
              </article>
            ))}
            {pending ? <div className="support-typing" aria-label="Assistant is replying"><i /><i /><i /></div> : null}
          </div>

          {messages.length === 1 ? <div className="support-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void sendMessage(suggestion)}>{suggestion}</button>)}</div> : null}

          {latestHandoff ? <button type="button" className="support-moderator-demo" onClick={simulateModerator}>Simulate moderator takeover</button> : null}

          <form className="support-compose" onSubmit={submit}>
            <label htmlFor="support-message-input" className="sr-only">Support message</label>
            <textarea id="support-message-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" maxLength={1000} rows={2} />
            <button type="submit" disabled={pending || !input.trim()} aria-label="Send support message">↑</button>
          </form>
          <footer><Link href="/support">Open support centre</Link><span>Mock mode — no live AI or moderator connected</span></footer>
        </section>
      ) : null}

      <button type="button" className="support-launcher" aria-label={open ? "Close support assistant" : "Open 24/7 support assistant"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="support-launcher-mark">AI</span>
        <span><strong>24/7 Support</strong><small>Ask AgentSiraji</small></span>
      </button>
    </div>
  );
}
