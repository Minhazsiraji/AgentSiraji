import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Support Moderator Queue",
  description: "Preview-only AgentSiraji support moderation console.",
  robots: { index: false, follow: false },
};

const mockQueue = [
  {
    ref: "MOCK-A12F93C1",
    topic: "Refund exception",
    reason: "Policy edge case needs human judgment",
    status: "Waiting for moderator",
  },
  {
    ref: "MOCK-B87D205A",
    topic: "Custom Commerce integration",
    reason: "Assistant confidence below threshold",
    status: "Waiting for moderator",
  },
  {
    ref: "MOCK-C4417BE2",
    topic: "Sensitive data warning",
    reason: "Customer attempted to share protected information",
    status: "Safety review",
  },
];

export default function SupportAdminPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Internal preview tool</span>
          <span className="kicker">AgentSiraji Support Operations</span>
          <h1>
            AI first.
            <br />
            <em>Moderator when needed.</em>
          </h1>
          <p>
            This preview-only queue demonstrates the future human-handoff workflow. No customer conversation is persisted here yet, and no production moderator account is connected.
          </p>
        </div>
        <div className="product-monogram">
          MQ
          <span>Moderator queue</span>
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Mock handoff queue</span>
            <h2>
              Escalate uncertainty.
              <br />
              <em>Never force an AI answer.</em>
            </h2>
          </div>
          <p>
            Final production moderation will require authenticated staff access, persistent conversation history, ownership/assignment, audit events, SLA timestamps, and controlled customer replies.
          </p>
        </div>

        <div className="product-grid">
          {mockQueue.map((item) => (
            <article className="product-card" key={item.ref}>
              <div className="product-copy">
                <span className="product-label">{item.status}</span>
                <h3>{item.topic}</h3>
                <p>{item.reason}</p>
                <p><strong>Reference:</strong> {item.ref}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
