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
        <p className="legal-date">Last updated: August 26, 2026</p>

        <h2>About these terms</h2>
        <p>These terms apply to the AgentSiraji website and standard AgentSiraji commercial services unless a separate written proposal, order, statement of work, license, data-processing agreement, or service agreement says otherwise. A separately agreed written document controls where it conflicts with these website terms. Nothing in these terms removes rights that cannot lawfully be excluded under applicable consumer or data-protection law.</p>

        <h2>Eligibility and authority</h2>
        <p>You must have legal capacity to enter the relevant agreement and, if acting for an organization, authority to bind that organization. You are responsible for ensuring that account, billing, business, and contact information you provide is accurate and kept reasonably current.</p>

        <h2>AgentSiraji Commerce</h2>
        <p>AgentSiraji Commerce is offered primarily as a managed e-commerce service. Published plan descriptions explain the standard scope available for Starter, Growth, and Pro. Customer-specific requirements, integrations, migration work, content preparation, third-party fees, and unusual operational requirements may require separate scope, timing, or pricing.</p>

        <h2>Orders, setup, and recurring service</h2>
        <p>Commerce plans may include a one-time setup fee and a recurring managed-service fee. An order is subject to availability, verification, and any required acceptance. Service activation requires verified payment or authorized manual-payment approval. A browser confirmation, screenshot, receipt upload, payment claim, or unverified callback alone does not create an entitlement to service.</p>

        <h2>Billing and taxes</h2>
        <p>Prices, billing frequency, included scope, and any applicable taxes or fees will be shown or agreed before purchase. Customers are responsible for taxes, duties, levies, withholding, or similar charges that lawfully apply to their purchase, except taxes based on AgentSiraji&apos;s own income. Third-party payment-provider or currency-conversion charges may apply independently.</p>

        <h2>Customer responsibilities</h2>
        <p>Customers are responsible for providing accurate business information, lawful products and content, necessary approvals, domain or account access when required, and timely feedback needed for delivery. Customers remain responsible for the legality of their products, offers, customer communications, privacy notices, taxes, fulfilment promises, refunds to their own shoppers, and business operations.</p>

        <h2>Acceptable use</h2>
        <p>You must not use AgentSiraji services to violate law, infringe intellectual-property or privacy rights, distribute malware, conduct fraud or deceptive activity, interfere with service security, attempt unauthorized access, probe or overload systems, evade usage or payment controls, or use the service for prohibited or high-risk activity that AgentSiraji has expressly declined. We may restrict or suspend affected access where reasonably necessary to protect customers, infrastructure, providers, or legal compliance.</p>

        <h2>Accounts and security</h2>
        <p>Where accounts are provided, you are responsible for protecting credentials, using access only for authorized personnel, and notifying us promptly of suspected compromise or unauthorized use. AgentSiraji may require credential resets, additional verification, or temporary access restrictions when reasonably necessary for security.</p>

        <h2>Third-party services</h2>
        <p>AgentSiraji products may rely on hosting, payment, messaging, database, analytics, domain, email, or other third-party services. Their availability, fees, policies, and technical limits may change independently of AgentSiraji. Where a third-party service is billed directly to the customer, that cost is the customer&apos;s responsibility unless agreed otherwise in writing.</p>

        <h2>Intellectual property and customer data</h2>
        <p>Customers retain ownership of their own brand assets, business content, product information, and customer data. AgentSiraji retains ownership of its platform code, shared systems, reusable components, methods, documentation, branding, and product intellectual property unless a separate written license or assignment expressly states otherwise. Customers grant AgentSiraji the limited rights reasonably necessary to host, process, reproduce, configure, and display customer materials solely to provide the contracted service.</p>

        <h2>Confidentiality</h2>
        <p>Where either party receives non-public business, technical, security, pricing, or customer information that is reasonably understood to be confidential, that party should use it only for the relationship and protect it with reasonable care. Confidentiality obligations do not apply to information that becomes public without breach, was lawfully known already, is independently developed, or must be disclosed by law.</p>

        <h2>Service changes and availability</h2>
        <p>We may improve, replace, or modify platform components as technology and provider requirements evolve while aiming to preserve the commercially agreed service outcome. We work to maintain reliable service but cannot guarantee uninterrupted access to every website, network, gateway, or third-party dependency. Planned or emergency maintenance may temporarily affect availability.</p>

        <h2>Suspension and termination</h2>
        <p>We may suspend affected services for material non-payment, security risk, unlawful use, abuse, provider restrictions, or a material breach that requires immediate protection. Where reasonable, we will provide notice and an opportunity to cure. Either party may terminate according to the applicable plan, order, cancellation policy, or separate agreement. Termination does not remove amounts already due or obligations intended to survive termination.</p>

        <h2>Cancellation and refunds</h2>
        <p>Cancellation and refund handling follows the published Refund &amp; Cancellation Policy and any customer-specific written agreement. Mandatory statutory cancellation, refund, warranty, or consumer rights take priority where they legally apply.</p>

        <h2>Warranties and disclaimers</h2>
        <p>AgentSiraji will provide paid services with reasonable care and skill consistent with the agreed scope. Except for rights or warranties that cannot lawfully be excluded, services are provided without guarantees that every third-party dependency will be uninterrupted, error-free, or suitable for every possible business purpose. Customers are responsible for deciding whether the service meets their regulatory and operational requirements.</p>

        <h2>Limitation of liability</h2>
        <p>To the maximum extent permitted by applicable law, neither party will be liable for indirect, incidental, special, exemplary, or consequential losses, or for lost profits, revenue, goodwill, or data, except where such exclusion is prohibited by law. Any contractual liability cap, if applicable, will be stated in the relevant order or service agreement. Nothing here excludes liability that cannot legally be limited, including liability arising from fraud, wilful misconduct, or other non-excludable obligations.</p>

        <h2>Indemnity for customer-controlled content and conduct</h2>
        <p>To the extent permitted by applicable law and any separate agreement, a business customer is responsible for claims arising from its unlawful products, content, instructions, misuse of the service, or infringement caused by materials it supplies, except to the extent the claim results from AgentSiraji&apos;s own breach or misconduct.</p>

        <h2>Products in development</h2>
        <p>LeadPilot and AdIntel may be shown before general availability. Doctor&apos;s Diary is a private healthcare project and is not currently offered for public sale. Development-stage features, pricing, and availability may change before release.</p>

        <h2>Changes to these terms</h2>
        <p>We may update these website terms for future use when services, providers, or legal requirements change. Material changes affecting an existing paid commitment will be handled consistently with the governing order or applicable law. The current version and last-updated date will remain published here.</p>

        <h2>Disputes and governing terms</h2>
        <p>Any specific governing law, forum, arbitration, or dispute-resolution process will be stated in the applicable customer order or separate agreement where required. If no separate term applies, mandatory law and legally competent courts will determine the applicable rights and forum. Nothing in these terms prevents either party from seeking urgent relief where legally available.</p>

        <h2>Contact</h2>
        <p>Questions about these terms can be sent to hello@agentsiraji.com.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
