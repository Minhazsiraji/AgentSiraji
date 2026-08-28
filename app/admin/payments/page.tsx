import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ManualPaymentReviewForm } from "@/components/ManualPaymentReviewForm";

export const metadata: Metadata = {
  title: "Commercial Payment Review",
  description: "AgentSiraji internal manual-payment review console.",
  robots: { index: false, follow: false },
};

export default function AdminPaymentsPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Internal preview tool</span>
          <span className="kicker">AgentSiraji Commercial Operations</span>
          <h1>Review manual payments.<br /><em>Activation stays controlled.</em></h1>
          <p>Approve, reject, or request more information for manual bank transfers and invoices. Proof submission never activates service by itself.</p>
        </div>
        <div className="product-monogram">AR<span>Admin review</span></div>
      </section>
      <section className="products shell section">
        <div className="product-grid"><ManualPaymentReviewForm /></div>
      </section>
      <SiteFooter />
    </main>
  );
}
