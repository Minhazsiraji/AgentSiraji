import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AgentSiraji handles website, customer, commerce, and payment-related information.",
};

export default function PrivacyPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal shell">
        <span className="kicker">Privacy</span>
        <h1>Privacy policy</h1>
        <p className="legal-date">Last updated: August 25, 2026</p>

        <h2>Information we collect</h2>
        <p>We collect information you provide when you contact AgentSiraji, request a service, begin a Commerce checkout, submit manual-payment evidence, or otherwise interact with our products. This may include your name, email address, organization details, selected product or plan, payment reference, and messages you send to us.</p>

        <h2>Commerce and payment information</h2>
        <p>For AgentSiraji Commerce, we keep the commercial records needed to track plans, payments, subscriptions, invoices, onboarding, and product access. Card or wallet credentials entered into supported payment providers are handled by those providers and are not intended to be stored by AgentSiraji.</p>

        <h2>How we use information</h2>
        <p>We use information to respond to enquiries, provide and support requested services, verify payments, manage subscriptions and access, prevent misuse, maintain business records, improve our products, and meet applicable operational or legal requirements. We do not sell personal information.</p>

        <h2>Service providers</h2>
        <p>We use selected infrastructure, hosting, database, email, payment, analytics, and operational providers where needed to run AgentSiraji. Providers receive only the information reasonably required for their role and are subject to their own terms and privacy practices.</p>

        <h2>Retention and security</h2>
        <p>We retain information for as long as reasonably necessary for service delivery, payment and accounting records, support, security, dispute handling, and legitimate business requirements. We use technical and operational safeguards appropriate to the service, but no online system can guarantee absolute security.</p>

        <h2>Your choices</h2>
        <p>You may contact us to request access, correction, or deletion of personal information where applicable. Some records may need to be retained when required for payment, accounting, fraud prevention, dispute handling, or other legitimate obligations.</p>

        <h2>Products in development</h2>
        <p>LeadPilot and AdIntel are not yet generally available. Doctor&apos;s Diary is a private healthcare project and is not currently offered for public sale. Product-specific privacy documentation will be added before any product begins processing categories of data that require additional notices or controls.</p>

        <h2>Contact</h2>
        <p>For privacy questions or requests, contact hello@agentsiraji.com.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
