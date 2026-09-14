import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { AdminLeadsInbox } from "@/components/AdminLeadsInbox";
import { LeadStatusReviewForm } from "@/components/LeadStatusReviewForm";
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
          <p>Every Store Audit, contact enquiry and direct Commerce order intent can now be worked from one owner inbox. Customer data remains protected behind the authenticated platform role.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/admin/analytics">Open analytics →</Link><Link className="text-link" href="/admin/integrations">Manage integrations <span>↗</span></Link></div>
        </div>
        <div className="product-monogram">AO<span>Owner operations</span></div>
      </section>

      <section className="products shell section">
        <OwnerBootstrap />
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div><span className="kicker">Sales inbox</span><h2>See every lead.<br /><em>Work the next action.</em></h2></div>
          <p>Use the compact list to search, filter and move leads through the sales stages. Ten leads are shown per page so the inbox stays usable as volume grows.</p>
        </div>
        <AdminLeadsInbox />
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div><span className="kicker">Pilot payment &amp; activation</span><h2>Verify before access.<br /><em>Provision only after payment.</em></h2></div>
          <p>Select “Review” from a lead row to preload this single bKash pilot console. This is the only payment-review path needed for the current direct-bKash pilot.</p>
        </div>
        <div className="product-grid"><div style={{ gridColumn: "1 / -1" }}><LeadStatusReviewForm /></div></div>
      </section>
      <SiteFooter />
    </main>
  );
}
