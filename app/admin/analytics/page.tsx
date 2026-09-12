import type { Metadata } from "next";
import Link from "next/link";
import { AdminAnalyticsDashboard } from "@/components/AdminAnalyticsDashboard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Admin Analytics",
  description: "AgentSiraji owner-only aggregate commercial analytics.",
  robots: { index: false, follow: false },
};

export default function AdminAnalyticsPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Owner analytics</span>
          <span className="kicker">AgentSiraji Commercial Operations</span>
          <h1>
            See the funnel.
            <br />
            <em>Without exposing customers.</em>
          </h1>
          <p>
            Read-only commercial analytics for leads, funnel progress, campaign attribution and owner-verified pilot revenue. Customer contact data is intentionally excluded.
          </p>
          <div className="hero-actions">
            <Link className="text-link" href="/admin">Back to operations <span>↗</span></Link>
          </div>
        </div>
        <div className="product-monogram">
          AA
          <span>Admin analytics</span>
        </div>
      </section>
      <AdminAnalyticsDashboard />
      <SiteFooter />
    </main>
  );
}
