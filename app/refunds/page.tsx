import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Refund, cancellation, renewal, and billing rules for AgentSiraji Commerce and related services.",
};

export default function RefundPolicyPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal shell">
        <span className="kicker">Commercial policy</span>
        <h1>Refund &amp; cancellation policy</h1>
        <p className="legal-date">Last updated: August 26, 2026</p>

        <h2>Scope</h2>
        <p>This policy applies to standard AgentSiraji Commerce setup and managed-service purchases unless a signed proposal, order, statement of work, business license, or other written agreement provides different terms. Mandatory statutory refund, cooling-off, warranty, or cancellation rights take priority wherever they legally apply.</p>

        <h2>General approach</h2>
        <p>AgentSiraji provides managed software, implementation, configuration, hosting, maintenance, and support services rather than ordinary downloadable consumer goods. Refund eligibility therefore depends on when cancellation is requested, whether work or a billing period has begun, what has been delivered or committed, and whether applicable law grants additional rights.</p>

        <h2>Before implementation starts</h2>
        <p>If a customer cancels before AgentSiraji begins implementation or reserves non-recoverable resources, an eligible setup payment may be refunded, less only lawful, disclosed, and non-recoverable third-party costs where permitted. If applicable law requires a full refund, that legal requirement controls.</p>

        <h2>After implementation starts</h2>
        <p>Once implementation, onboarding, configuration, migration, design, integration, content preparation, or other customer-specific work has started, the setup fee becomes non-refundable to the extent it reasonably covers work already performed, delivery capacity reserved, or third-party commitments already made. Where appropriate, we may provide an itemized explanation of the retained amount.</p>

        <h2>Recurring managed-service cancellation</h2>
        <p>Customers may request cancellation of a recurring managed service before the next renewal or billing cycle. Once cancellation is processed, future renewal will stop. Unless a separate agreement or applicable law says otherwise, the service remains available through the already-paid billing period and cancellation does not automatically create a refund for that period.</p>

        <h2>Renewal and failed payment</h2>
        <p>Where recurring billing is enabled, renewal timing and amount will follow the agreed plan. If a renewal payment fails, access may enter a grace, past-due, restricted, or suspended state depending on the service and provider. We will not treat an unverified or failed payment as successful activation.</p>

        <h2>Cooling-off and statutory withdrawal rights</h2>
        <p>Some jurisdictions provide consumers with a statutory withdrawal or cooling-off period for distance contracts or digital services. Where those rules legally apply to a purchase, AgentSiraji will honor the applicable right and any lawful exceptions, including rules concerning services that begin at the customer&apos;s request or digital content supplied with required consent and acknowledgment. Business-to-business purchases may have different rules.</p>

        <h2>Duplicate, unauthorized, or incorrect charges</h2>
        <p>If you believe you were charged twice, charged the wrong amount, charged after a confirmed cancellation, or did not authorize a charge, contact us promptly with the relevant payment reference. We will investigate against our commercial and provider records. Verified billing errors will be corrected or refunded as appropriate. Suspected fraud or account compromise may require additional verification.</p>

        <h2>Service failure</h2>
        <p>If AgentSiraji materially fails to provide an agreed paid service and cannot reasonably cure the failure within an appropriate period after notice, the customer may be eligible for a proportionate refund, service credit, or other remedy required by the governing agreement or applicable law.</p>

        <h2>Payment-provider refunds</h2>
        <p>Approved refunds may be returned through the original payment provider when supported. Settlement timing, card-network timing, currency conversion, intermediary-bank handling, and some provider-controlled charges may be outside AgentSiraji&apos;s control. We will not intentionally retain provider refunds that are due to the customer.</p>

        <h2>Custom work and third-party costs</h2>
        <p>Approved domains, paid integrations, external subscriptions, licenses, advertising spend, data migration, specialist work, or other customer-specific third-party costs are not refundable once purchased or irrevocably committed unless the underlying provider refunds them or applicable law requires otherwise.</p>

        <h2>Chargebacks and disputes</h2>
        <p>Customers should contact us first so we can investigate billing concerns quickly. A chargeback or payment dispute does not itself determine entitlement to continued service. Where a dispute is opened, we may provide relevant transaction, service, and communication records to the payment provider as permitted by law and may temporarily restrict disputed service access where reasonably necessary.</p>

        <h2>How to request cancellation or a refund</h2>
        <p>Contact hello@agentsiraji.com with your organization name, product or plan, payment reference, requested action, and reason. Do not email full card numbers, passwords, one-time codes, or unnecessary sensitive financial information. We will confirm receipt and review the commercial record.</p>

        <h2>Refund method and timing</h2>
        <p>Approved refunds are normally sent to the original payment method where available and appropriate. The time for funds to appear depends on the provider and financial institution. Where a manual refund is necessary, additional identity or account verification may be required to reduce fraud risk.</p>

        <h2>Separate agreements</h2>
        <p>A signed proposal, enterprise agreement, business license, statement of work, or other written commercial agreement may contain different cancellation, termination, service-credit, or refund terms. Those agreed terms take priority for that engagement, subject to rights that cannot lawfully be waived.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
