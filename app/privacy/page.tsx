import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AgentSiraji collects, uses, protects, retains, and shares website, customer, commerce, and payment-related information.",
};

export default function PrivacyPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal shell">
        <span className="kicker">Privacy</span>
        <h1>Privacy policy</h1>
        <p className="legal-date">Last updated: August 26, 2026</p>

        <h2>Scope and privacy principles</h2>
        <p>This policy explains how AgentSiraji handles personal information relating to visitors, prospects, customers, customer representatives, and users of our commercial services. We follow the principles of purpose limitation, data minimisation, accuracy, security, retention limitation, transparency, and accountability. Product-specific notices may apply where a service processes additional categories of information.</p>

        <h2>Information we collect</h2>
        <p>Depending on how you interact with us, we may collect identifiers and contact details such as name, email address, phone number and organization; commercial information such as selected product, plan, order, invoice, payment reference and subscription status; communications and support messages; onboarding and service-configuration information; fraud, security and audit records; and technical information such as IP address, browser, device, request and diagnostic data that our infrastructure generates.</p>

        <h2>Sources of information</h2>
        <p>We collect information directly from you, from your organization or authorized representatives, from payment and service providers that confirm transaction or service status, and automatically through the systems used to operate, secure, and diagnose the website and services. We do not intentionally obtain personal information from data brokers for sale or profiling.</p>

        <h2>Commerce and payment information</h2>
        <p>For AgentSiraji Commerce, we keep commercial records needed to manage plans, payments, subscriptions, invoices, onboarding, entitlements, support and account access. Card, wallet, or bank credentials entered directly into supported payment providers are handled by those providers and are not intended to be stored by AgentSiraji. Manual-payment evidence should contain only information reasonably necessary to verify the payment.</p>

        <h2>Purposes and lawful grounds</h2>
        <p>We process information to provide requested services and perform contracts; take steps requested before entering a contract; verify payments and manage subscriptions; respond to enquiries and support; secure our systems and prevent abuse or fraud; maintain accounting, audit and dispute records; improve service reliability and usability; comply with legal obligations; and pursue legitimate business interests where those interests are not overridden by applicable privacy rights. Where applicable law requires consent, we rely on consent and permit withdrawal as required by law.</p>

        <h2>How we share information</h2>
        <p>We may disclose information to hosting, database, email, payment, analytics, security, support, professional-adviser and operational service providers where reasonably necessary to deliver or protect the service. We may also disclose information when required by law, valid legal process, or to protect rights, safety, property, and service integrity. We do not sell personal information for money and do not intentionally share personal information for cross-context behavioural advertising.</p>

        <h2>International transfers</h2>
        <p>AgentSiraji and its service providers may process information in countries other than the country where you are located. Where applicable law requires transfer safeguards, we will use an appropriate lawful mechanism or other recognized safeguard and will provide relevant information on request where legally required.</p>

        <h2>Retention</h2>
        <p>We retain personal information only for as long as reasonably necessary for the purposes described here, including service delivery, payment and accounting records, legal or contractual obligations, fraud and security prevention, audit, dispute handling, and enforcement. Retention periods vary by record type. When information is no longer required, we delete, anonymize, or securely isolate it as appropriate, subject to lawful retention requirements.</p>

        <h2>Security</h2>
        <p>We use administrative, technical, and operational safeguards appropriate to the nature of the service, including access controls, encrypted transport, secure hosting practices, restricted secrets, validation, logging, replay/idempotency protections for payment events, and production feature gates. No online system can guarantee absolute security. If we become aware of a personal-data incident requiring notification under applicable law, we will take reasonable containment, investigation, remediation, and notification steps.</p>

        <h2>Your privacy rights</h2>
        <p>Depending on where you live and the law that applies, you may have rights to request access to personal information, correction, deletion, restriction, portability, information about processing, withdrawal of consent, objection to certain processing, or review of certain automated decisions. Where applicable, you may also have a right to complain to a data-protection authority and a right not to receive discriminatory treatment for exercising privacy rights. We will verify requests where reasonably necessary and may retain information where a lawful exception applies.</p>

        <h2>California and similar state privacy rights</h2>
        <p>Where a US state privacy law applies to AgentSiraji, eligible residents may exercise the rights provided by that law, which can include rights to know/access, correct, delete, obtain a copy, and opt out of covered sale, sharing, targeted advertising, or certain profiling. AgentSiraji does not currently sell personal information for monetary consideration. If our practices materially change, this policy and any required opt-out mechanism will be updated before the new practice is used where required.</p>

        <h2>Cookies and similar technologies</h2>
        <p>Essential technologies may be used for security, session operation, preferences, checkout and service functionality. If we introduce non-essential analytics, advertising, or profiling technologies that require consent or an opt-out in a relevant jurisdiction, we will provide the appropriate control before relying on them as required by law.</p>

        <h2>Children</h2>
        <p>AgentSiraji&apos;s commercial website and Commerce services are intended for businesses and adults acting for businesses. We do not knowingly solicit personal information from children through these services. If you believe a child has provided personal information to us inappropriately, contact us so we can review and take appropriate action.</p>

        <h2>Automated decision-making</h2>
        <p>The current Commerce purchasing and account processes are not intended to make solely automated decisions that produce legal or similarly significant effects about individuals. If that changes, we will provide additional disclosures and rights where required.</p>

        <h2>Products in development</h2>
        <p>LeadPilot and AdIntel are not yet generally available. Doctor&apos;s Diary is a private healthcare project and is not currently offered for public sale. Product-specific privacy and security documentation will be completed before any public product begins processing sensitive or specially regulated categories of information.</p>

        <h2>Changes to this policy</h2>
        <p>We may update this policy when our services, providers, or legal obligations change. The current version and its last-updated date will remain published here. Material changes will receive additional notice where applicable law requires it.</p>

        <h2>Contact and requests</h2>
        <p>For privacy questions or requests, contact hello@agentsiraji.com. We will use reasonable steps to authenticate rights requests and respond within the period required by applicable law.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
