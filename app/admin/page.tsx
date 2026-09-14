import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LeadStatusReviewForm } from "@/components/LeadStatusReviewForm";
import { ManualPaymentReviewForm } from "@/components/ManualPaymentReviewForm";
import { OwnerBootstrap } from "@/components/OwnerBootstrap";

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
          <span className="status">Authenticated owner operations</span>
          <span className="kicker">AgentSiraji Commercial Operations</span>
          <h1>Follow leads.<br /><em>Keep activation controlled.</em></h1>
          <p>Owner access is moving from reusable header tokens to passwordless email sessions with explicit platform roles. Customer data remains protected behind server authorization.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/admin/analytics">Open analytics →</Link><Link className="text-link" href="/admin/integrations">Manage integrations <span>↗</span></Link></div>
        </div>
        <div className="product-monogram">AO<span>Owner operations</span></div>
      </section>

      <section className="products shell section">
        <OwnerBootstrap />
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div><span className="kicker">Pilot sales workflow</span><h2>New to won.<br /><em>Every step stays explicit.</em></h2></div>
          <p>Move leads through NEW, CONTACTED, QUALIFIED, PROPOSAL, WON or LOST. Manual payment verification remains owner-controlled, and review actions are tied to the authenticated account.</p>
        </div>
        <div className="product-grid"><LeadStatusReviewForm /><ManualPaymentReviewForm /></div>
      </section>
      <SiteFooter />
    </main>
  );
}
