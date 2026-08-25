import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using AgentSiraji websites, products, and managed Commerce services.",
};

export default function TermsPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal shell">
        <span className="kicker">Terms</span>
        <h1>Terms of service</h1>
        <p className="legal-date">Last updated: August 25, 2026</p>

        <h2>About these terms</h2>
        <p>These terms apply to the AgentSiraji website and to standard AgentSiraji services unless a separate written proposal, order, statement of work, license, or service agreement says otherwise. A separately agreed written document controls where it conflicts with these website terms.</p>

        <h2>AgentSiraji Commerce</h2>
        <p>AgentSiraji Commerce is offered primarily as a managed e-commerce service. Published plan descriptions explain the standard scope available for Starter, Growth, and Pro. Customer-specific requirements, integrations, migration work, content preparation, third-party fees, and unusual operational requirements may require separate scope or pricing.</p>

        <h2>Setup and recurring service</h2>
        <p>Commerce plans may include a one-time setup fee and a recurring managed-service fee. Service activation requires verified payment or an authorized manual-payment approval. A browser confirmation, screenshot, receipt upload, or payment claim alone does not create an entitlement to service.</p>

        <h2>Customer responsibilities</h2>
        <p>Customers are responsible for providing accurate business information, lawful products and content, necessary approvals, domain or account access when required, and timely feedback needed for delivery. Customers remain responsible for the legality of their products, offers, customer communications, taxes, and business operations.</p>

        <h2>Third-party services</h2>
        <p>AgentSiraji products may rely on hosting, payment, messaging, database, analytics, domain, email, or other third-party services. Their availability, fees, policies, and technical limits may change independently of AgentSiraji. Where a third-party service is billed directly to the customer, that cost is the customer&apos;s responsibility unless agreed otherwise in writing.</p>

        <h2>Intellectual property and customer data</h2>
        <p>Customers retain ownership of their own brand assets, business content, product information, and customer data. AgentSiraji retains ownership of its platform code, shared systems, reusable components, methods, branding, and product intellectual property unless a separate written license or assignment expressly states otherwise.</p>

        <h2>Service changes and availability</h2>
        <p>We may improve, replace, or modify platform components as technology and provider requirements evolve, while aiming to preserve the commercially agreed service outcome. We work to maintain reliable service but cannot guarantee uninterrupted access to every website, network, gateway, or third-party dependency.</p>

        <h2>Cancellation and refunds</h2>
        <p>Cancellation and refund handling follows the published Refund &amp; Cancellation Policy and any customer-specific written agreement.</p>

        <h2>Products in development</h2>
        <p>LeadPilot and AdIntel may be shown before general availability. Doctor&apos;s Diary is a private healthcare project and is not currently offered for public sale. Development-stage features, pricing, and availability may change before release.</p>

        <h2>Contact</h2>
        <p>Questions about these terms can be sent to hello@agentsiraji.com.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
