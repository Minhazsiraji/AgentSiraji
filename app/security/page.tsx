import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Security Practices",
  description: "AgentSiraji security practices for the website, Commerce platform, payments, access control, and incident handling.",
};

export default function SecurityPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal shell">
        <span className="kicker">Security</span>
        <h1>Security practices</h1>
        <p className="legal-date">Last updated: August 26, 2026</p>

        <h2>Security approach</h2>
        <p>AgentSiraji applies layered administrative, application, infrastructure, and operational safeguards appropriate to the services we provide. Security is treated as an ongoing engineering and operational responsibility rather than a one-time certification claim.</p>

        <h2>Transport and browser protections</h2>
        <p>Production services are intended to use HTTPS/TLS. The website applies security headers including content-type protection, clickjacking protection, referrer controls, permissions restrictions, HSTS, and a Content Security Policy designed to limit where executable content and external resources can load from.</p>

        <h2>Application security</h2>
        <p>Commercial APIs validate expected content types, input shape, body size, and relevant origin conditions. Sensitive errors are not intentionally exposed to customers. Payment and administrative endpoints use explicit trust boundaries, production feature gates, and server-side verification rather than relying on browser-supplied payment claims.</p>

        <h2>Payment integrity</h2>
        <p>Payment activation is based on verified provider confirmation or authorized manual review. Gateway callbacks and webhooks use provider validation or signature verification, amount/currency/reference checks where applicable, bounded payloads, and replay/idempotency controls. Duplicate callbacks must not create duplicate AgentSiraji activation. Live payment remains disabled until production acceptance is completed.</p>

        <h2>Secrets and privileged access</h2>
        <p>API keys, merchant secrets, database credentials, and administrative tokens are intended to remain server-side and outside public source code. Privileged operations require dedicated authorization controls. Customer and administrative authentication will be enforced before those production account surfaces are enabled.</p>

        <h2>Data access and isolation</h2>
        <p>Access to customer commercial information is intended to follow least-privilege principles and organization/account boundaries. Before production customer account access is enabled, we verify that one customer or organization cannot read another customer&apos;s payment, subscription, entitlement, or onboarding information.</p>

        <h2>Infrastructure and providers</h2>
        <p>AgentSiraji uses reputable hosting, database, payment, email, and operational providers. Provider controls supplement but do not replace AgentSiraji&apos;s own application-level safeguards. Third-party availability and security responsibilities are governed by the relevant provider relationship.</p>

        <h2>Logging, monitoring, and auditability</h2>
        <p>We maintain operational and payment-event records appropriate to the service so failures, reviews, and activation decisions can be investigated. Production monitoring and reconciliation procedures are part of the go-live readiness process.</p>

        <h2>Vulnerability and dependency management</h2>
        <p>We use automated build quality gates, dependency locking, code review practices, and framework security updates as part of normal maintenance. Security-impacting issues are prioritized according to severity, exploitability, and customer impact.</p>

        <h2>Incident response</h2>
        <p>If payment integrity, authorization, or account isolation is uncertain, our default operational response is to disable the affected activation path before accepting additional risk. Security or privacy incidents are investigated, contained, remediated, documented, and notified where applicable law or contract requires notification.</p>

        <h2>Customer responsibilities</h2>
        <p>Customers should protect account credentials, restrict staff access appropriately, use supported browsers and devices, keep their own domain and third-party accounts secure, and promptly report suspected compromise. Customers should never send passwords, full card numbers, private keys, or one-time authentication codes through ordinary support messages.</p>

        <h2>Responsible reporting</h2>
        <p>If you believe you have discovered a security vulnerability affecting AgentSiraji, report it privately to hello@agentsiraji.com with enough detail for us to reproduce and assess the issue. Please avoid accessing, changing, retaining, or disclosing data that is not yours and avoid actions that could disrupt service availability.</p>

        <h2>Compliance statement</h2>
        <p>This page describes current security practices and design goals. It does not claim ISO, SOC, PCI DSS, or other independent certification unless AgentSiraji explicitly publishes evidence of that certification. Payment-card handling responsibilities are primarily delegated to supported payment providers where applicable.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
