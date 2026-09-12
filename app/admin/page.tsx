import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LeadStatusReviewForm } from "@/components/LeadStatusReviewForm";
import { ManualPaymentReviewForm } from "@/components/ManualPaymentReviewForm";

export const metadata: Metadata = {
  title: "Commercial Operations",
  description: "AgentSiraji internal sales lead and manual-payment operations console.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Token-gated pilot operations</span>
          <span className="kicker">AgentSiraji Commercial Operations</span>
          <h1>
            Follow leads.
            <br />
            <em>Keep activation controlled.</em>
          </h1>
          <p>
            Use the temporary owner token to update a saved sales lead or review a legacy manual-payment record. Customer data is not listed on this page; lead updates require the durable lead ID from the owner notification.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/admin/analytics">Open analytics →</Link>
            <Link className="text-link" href="/admin/integrations">Manage integrations <span>↗</span></Link>
          </div>
        </div>
        <div className="product-monogram">
          AO
          <span>Owner operations</span>
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Pilot sales workflow</span>
            <h2>
              New to won.
              <br />
              <em>Every step stays explicit.</em>
            </h2>
          </div>
          <p>
            Move leads through NEW, CONTACTED, QUALIFIED, PROPOSAL, WON or LOST. Record a manual payment reference only after the owner verifies receipt. Never share the owner token in chat or commit it to source.
          </p>
        </div>
        <div className="product-grid">
          <LeadStatusReviewForm />
          <ManualPaymentReviewForm />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
