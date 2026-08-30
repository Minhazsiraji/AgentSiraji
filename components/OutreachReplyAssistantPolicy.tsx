"use client";

import { useEffect, useMemo, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

const tokenKey = "agentsiraji-outreach-admin-token";

type HistoryMessage = {
  id: string;
  direction: "INBOUND" | "SUGGESTED" | "OUTBOUND";
  body: string;
  intent: string | null;
  recommendedProduct: string | null;
  nextAction: string | null;
  confidence: number | null;
  createdAt: string;
};

type Analysis = {
  intent: string;
  recommendedProduct: string;
  nextAction: string;
  replyStatus: string;
  suggestedReply: string;
  confidence: number;
  humanReview: boolean;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  analysis?: Analysis;
  history?: HistoryMessage[];
};

function label(value: string | null | undefined) {
  if (!value) return "—";
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function refreshDashboard() {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (item) => item.textContent?.trim() === "Refresh",
  );
  button?.click();
}

function latestUnsentSuggestion(history: HistoryMessage[]) {
  let result: HistoryMessage | null = null;
  for (const item of history) {
    if (item.direction === "SUGGESTED") result = item;
    if (item.direction === "OUTBOUND" && result) result = null;
  }
  return result;
}

function ReplyAssistantCard({ profileUrl, businessName }: { profileUrl: string; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [clientReply, setClientReply] = useState("");
  const [suggestedReply, setSuggestedReply] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  const conversation = useMemo(
    () => history.filter((item) => item.direction !== "SUGGESTED").slice(-8),
    [history],
  );

  async function api(body?: object) {
    const token = sessionStorage.getItem(tokenKey) || "";
    if (!token) throw new Error("Unlock the outreach workspace again so Reply Assistant can authenticate.");

    const response = await fetch(
      body ? "/api/admin/outreach/reply" : `/api/admin/outreach/reply?profileUrl=${encodeURIComponent(profileUrl)}`,
      body
        ? {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-agentsiraji-admin-token": token,
            },
            body: JSON.stringify(body),
          }
        : {
            headers: { "x-agentsiraji-admin-token": token },
            cache: "no-store",
          },
    );
    const payload = (await response.json()) as ApiResponse;
    if (!response.ok) throw new Error(payload.error || "Reply Assistant request failed.");
    return payload;
  }

  async function loadHistory() {
    if (loaded) return;
    setLoading(true);
    setMessage("");
    try {
      const payload = await api();
      const nextHistory = payload.history ?? [];
      setHistory(nextHistory);
      const unsent = latestUnsentSuggestion(nextHistory);
      if (unsent) {
        setSuggestedReply(unsent.body);
        setAnalysis({
          intent: unsent.intent || "DISCOVERY",
          recommendedProduct: unsent.recommendedProduct || "DISCOVERY",
          nextAction: unsent.nextAction || "DISCOVERY",
          replyStatus: "POSITIVE",
          confidence: unsent.confidence ?? 0,
          humanReview: (unsent.confidence ?? 1) < 0.75,
          suggestedReply: unsent.body,
        });
      }
      setLoaded(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reply history could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await loadHistory();
  }

  async function analyze() {
    if (!clientReply.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const payload = await api({ type: "ANALYZE", profileUrl, clientReply: clientReply.trim() });
      if (!payload.analysis) throw new Error("No reply analysis was returned.");
      setAnalysis(payload.analysis);
      setSuggestedReply(payload.analysis.suggestedReply);
      setHistory(payload.history ?? []);
      setClientReply("");
      setLoaded(true);
      setMessage("Client reply saved. Review the suggested response before sending.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Client reply could not be analyzed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    if (!suggestedReply.trim()) return;
    try {
      await navigator.clipboard.writeText(suggestedReply.trim());
      setMessage("Suggested reply copied. Send it from the official client conversation, then mark it sent here.");
    } catch {
      setMessage("Copy failed. Select the suggested reply manually.");
    }
  }

  async function markSent() {
    if (!suggestedReply.trim() || !analysis) return;
    setLoading(true);
    setMessage("");
    try {
      const payload = await api({
        type: "MARK_REPLY_SENT",
        profileUrl,
        reply: suggestedReply.trim(),
        intent: analysis.intent,
        recommendedProduct: analysis.recommendedProduct,
        nextAction: analysis.nextAction,
      });
      setHistory(payload.history ?? []);
      setSuggestedReply("");
      setAnalysis(null);
      setMessage("Reply recorded as sent. Conversation history is saved.");
      window.setTimeout(() => refreshDashboard(), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reply could not be recorded.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,.12)", marginTop: ".9rem", paddingTop: ".85rem" }}>
      <button className="button" type="button" onClick={() => void toggle()}>
        {open ? "Close Reply Assistant" : "Client replied? → Reply Assistant"}
      </button>

      {open && (
        <div style={{ marginTop: ".8rem", display: "grid", gap: ".7rem" }}>
          <div>
            <span className="kicker">Conversation intelligence</span>
            <p style={{ margin: ".3rem 0 0" }}>
              Paste exactly what <strong>{businessName}</strong> replied. AgentSiraji will route the need to Commerce, LeadPilot, AdIntel, partner flow or no pitch.
            </p>
          </div>

          <label>
            <strong>Client reply</strong><br />
            <textarea
              rows={3}
              value={clientReply}
              onChange={(event) => setClientReply(event.target.value)}
              placeholder="Example: We already have a website."
              style={{ width: "100%", marginTop: ".35rem" }}
            />
          </label>

          <div style={{ display: "flex", gap: ".55rem", flexWrap: "wrap", alignItems: "center" }}>
            <button className="button button-primary" type="button" disabled={loading || !clientReply.trim()} onClick={() => void analyze()}>
              {loading ? "Analyzing…" : "Analyze & prepare reply →"}
            </button>
            <span style={{ fontSize: ".9rem", opacity: .8 }}>No external message is sent automatically.</span>
          </div>

          {analysis && (
            <div className="product-card" style={{ padding: ".85rem 1rem", minHeight: 0 }}>
              <div style={{ display: "flex", gap: ".45rem", flexWrap: "wrap", marginBottom: ".65rem" }}>
                <span className="status">Intent: {label(analysis.intent)}</span>
                <span className="product-label">Route: {label(analysis.recommendedProduct)}</span>
                <span className="product-label">Next: {label(analysis.nextAction)}</span>
                {analysis.humanReview && <span className="product-label">Review carefully</span>}
              </div>

              <label>
                <strong>Suggested next reply</strong><br />
                <textarea
                  rows={5}
                  value={suggestedReply}
                  onChange={(event) => setSuggestedReply(event.target.value)}
                  style={{ width: "100%", marginTop: ".35rem" }}
                />
              </label>
              <div style={{ display: "flex", gap: ".55rem", flexWrap: "wrap", marginTop: ".6rem" }}>
                <button className="button button-primary" type="button" onClick={() => void copyReply()} disabled={!suggestedReply.trim()}>
                  Copy reply
                </button>
                <button className="button" type="button" onClick={() => void markSent()} disabled={loading || !suggestedReply.trim()}>
                  Mark reply sent
                </button>
              </div>
            </div>
          )}

          {conversation.length > 0 && (
            <details>
              <summary><strong>Conversation history ({conversation.length})</strong></summary>
              <div style={{ display: "grid", gap: ".5rem", marginTop: ".55rem" }}>
                {conversation.map((item) => (
                  <div key={item.id} style={{ padding: ".65rem .75rem", border: "1px solid rgba(255,255,255,.1)", borderRadius: ".8rem" }}>
                    <strong>{item.direction === "INBOUND" ? "Client" : "You"}</strong>
                    <p style={{ margin: ".2rem 0 0", whiteSpace: "pre-wrap" }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {message && <p style={{ margin: 0 }} aria-live="polite"><strong>{message}</strong></p>}
        </div>
      )}
    </div>
  );
}

export function OutreachReplyAssistantPolicy() {
  useEffect(() => {
    const roots = new Map<HTMLElement, Root>();

    function scan() {
      for (const [host, root] of roots) {
        if (!host.isConnected) {
          root.unmount();
          roots.delete(host);
        }
      }

      document.querySelectorAll<HTMLElement>("article.product-card").forEach((article) => {
        const text = article.textContent || "";
        if (!text.includes("First sent:") || text.includes("First sent: —")) return;
        if (article.querySelector("[data-outreach-reply-assistant]")) return;

        const officialLink = Array.from(article.querySelectorAll<HTMLAnchorElement>("a[href]")).find((anchor) =>
          anchor.textContent?.includes("Open official contact"),
        );
        const businessName = article.querySelector("h3")?.textContent?.trim() || "Client";
        if (!officialLink?.href) return;

        const host = document.createElement("div");
        host.dataset.outreachReplyAssistant = "true";
        article.appendChild(host);
        const root = createRoot(host);
        roots.set(host, root);
        root.render(<ReplyAssistantCard profileUrl={officialLink.href} businessName={businessName} />);
      });
    }

    scan();
    const observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      for (const root of roots.values()) root.unmount();
      roots.clear();
    };
  }, []);

  return null;
}
