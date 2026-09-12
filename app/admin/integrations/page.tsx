import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { IntegrationSettings } from "@/components/IntegrationSettings";

export const metadata: Metadata = {
  title: "Integration center",
  description: "AgentSiraji owner-only integration configuration center.",
  robots: { index: false, follow: false },
};

export default function IntegrationsAdminPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Private integration center</span>
          <span className="kicker">AgentSiraji Operations</span>
          <h1>Connect the stack.<br /><em>Keep credentials controlled.</em></h1>
          <p>Save AgentSiraji-only Meta, Google tag and LeadPilot configuration without exposing secret values in the browser, public source or health responses.</p>
          <div className="hero-actions">
            <Link className="text-link" href="/admin">Back to operations <span>↗</span></Link>
          </div>
        </div>
        <div className="product-monogram">IN<span>Integrations</span></div>
      </section>
      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Credential boundary</span>
            <h2>One place to configure.<br /><em>Secrets stay secret.</em></h2>
          </div>
          <p>Settings are encrypted before storage. Saved secrets are never returned to the browser, and this center does not enable live payment processing.</p>
        </div>
        <IntegrationSettings />
      </section>
      <SiteFooter />
    </main>
  );
}
