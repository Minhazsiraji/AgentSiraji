import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { IntegrationSettings } from "@/components/IntegrationSettings";

export const metadata: Metadata = { title: "Integration health", description: "AgentSiraji integration connection center.", robots: { index: false, follow: false } };

export default function IntegrationsAdminPage() {
  return <main><SiteHeader /><section className="product-hero lead-product shell"><div><span className="status">Private integration center</span><span className="kicker">AgentSiraji Operations</span><h1>Connect the stack.<br /><em>See its health.</em></h1><p>Save the AgentSiraji-only Meta, Google and LeadPilot credentials once, then check each connection without exposing secret values in the browser or logs.</p></div><div className="product-monogram">IN<span>Integrations</span></div></section><section className="products shell section"><div className="section-heading"><div><span className="kicker">Credential boundary</span><h2>One place to configure.<br /><em>Clear status to act.</em></h2></div><p>Settings are encrypted before storage. The panel never displays a token again, sends a test lead, or enables live payment processing.</p></div><IntegrationSettings /></section><SiteFooter /></main>;
}
