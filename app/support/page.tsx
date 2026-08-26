import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "24/7 Support",
  description: "AgentSiraji support centre and AI-first support assistant preview.",
};

const supportAreas = [
  ["Commerce", "Plans, pricing, storefront scope, onboarding and managed service questions."],
  ["Payments", "Bangladesh and international payment-route information with live activation still gated."],
  ["Policies", "Privacy, security, terms, refund and cancellation guidance from published AgentSiraji pages."],
  ["Products", "Current status and scope for LeadPilot, AdIntel and AgentSiraji Labs projects."],
];

export default function SupportPage() {
  return (
    <main>
      <SiteHeader />

      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Mock testing now</span>
          <span className="kicker">AgentSiraji 24/7 Support</span>
          <h1>
            Fast answers first.
            <br />
            <em>Human help when needed.</em>
          </h1>
          <p>
            The Support Assistant is being built as an AI-first service layer. It answers from verified AgentSiraji information, avoids guessing when confidence is low, and escalates the conversation to a moderator when human judgment is required.
          </p>
        </div>
        <div className="product-monogram">
          AI
          <span>Support</span>
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Mock scope</span>
            <h2>
              Test the service logic.
              <br />
              <em>No live AI cost yet.</em>
            </h2>
          </div>
          <p>
            The floating chat currently uses a guarded mock knowledge engine and simulated moderator handoff. No external AI provider, production ticket queue, or live moderator account is connected yet.
          </p>
        </div>

        <div className="product-grid">
          {supportAreas.map(([title, description]) => (
            <article className="product-card" key={title}>
              <div className="product-copy">
                <span className="product-label">Support area</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="services section">
        <div className="shell">
          <div className="section-heading light-heading">
            <div>
              <span className="kicker">Final architecture</span>
              <h2>
                AI resolves the routine.
                <br />
                <em>Moderators handle judgment.</em>
              </h2>
            </div>
            <p>
              The production version will preserve the same customer experience while replacing the mock responder and mock ticket reference with a real AI provider, persistent conversation store, moderator queue, audit trail, response SLA controls, and approved support identity.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
