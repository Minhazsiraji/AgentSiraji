import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ManualPaymentReviewForm } from "@/components/ManualPaymentReviewForm";

export const metadata: Metadata = {
  title: "Commercial Payment Review",
  description: "AgentSiraji internal manual-payment review console.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Internal preview tool</span>
          <span className="kicker">AgentSiraji Commercial Operations</span>
          <h1>
            Review manual payments.
            <br />
            <em>Activation stays controlled.</em>
          </h1>
          <p>
            Use this preview-only console to approve, reject, or request more
            information for manual bank transfers and manual invoices. The admin
            token is submitted only with the review request and is not stored by
            this page.
          </p>
          <p>
            <Link className="button" href="/admin/outreach">Open Foreign Outreach →</Link>
          </p>
        </div>
        <div className="product-monogram">
          AR
          <span>Admin review</span>
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Manual payment trust boundary</span>
            <h2>
              Proof can request review.
              <br />
              <em>Only approval can activate.</em>
            </h2>
          </div>
          <p>
            Enter the payment reference, your temporary admin review token, and
            the decision. Never share the token in chat or commit it to source.
          </p>
        </div>
        <div className="product-grid">
          <ManualPaymentReviewForm />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
