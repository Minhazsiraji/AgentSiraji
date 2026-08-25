import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Refund, cancellation, and billing rules for AgentSiraji Commerce and related services.",
};

export default function RefundPolicyPage() {
  return (
    <main>
      <SiteHeader />
      <article className="legal shell">
        <span className="kicker">Commercial policy</span>
        <h1>Refund &amp; cancellation policy</h1>
        <p className="legal-date">Last updated: August 25, 2026</p>

        <h2>General approach</h2>
        <p>AgentSiraji sells managed software and implementation services rather than downloadable consumer goods. Refund eligibility therefore depends on whether paid setup or service work has already started, what has been delivered, and any separate written agreement with the customer.</p>

        <h2>Commerce setup fees</h2>
        <p>If a customer cancels before AgentSiraji begins implementation work, the setup fee may be refunded, less any non-recoverable payment-provider charges or specifically approved third-party costs. Once implementation work has started, the setup fee becomes non-refundable to the extent it covers work already performed, reserved delivery capacity, configuration, onboarding, or customer-specific setup.</p>

        <h2>Monthly managed-service fees</h2>
        <p>Customers may request cancellation of the recurring managed service before the next billing cycle. Cancellation prevents future renewal once processed. Fees for a billing period that has already started are normally non-refundable because service capacity, hosting, maintenance, and support are made available for that period, unless a separate written agreement or applicable law requires otherwise.</p>

        <h2>Duplicate or incorrect charges</h2>
        <p>If you believe you were charged twice, charged the wrong amount, or charged after a confirmed cancellation, contact us promptly with the relevant payment reference. Verified billing errors will be corrected or refunded as appropriate.</p>

        <h2>Payment-provider refunds</h2>
        <p>Approved refunds may be returned through the original payment provider when supported. Processing times, currency conversion, card-network timing, bank settlement, and provider fees may be controlled by the payment provider rather than AgentSiraji.</p>

        <h2>Custom work and third-party costs</h2>
        <p>Approved domains, paid integrations, external subscriptions, licenses, advertising spend, data migration, specialist work, or other customer-specific third-party costs are not refundable once purchased or committed unless the underlying provider refunds them.</p>

        <h2>How to request cancellation or a refund</h2>
        <p>Contact hello@agentsiraji.com with your organization name, product or plan, payment reference, and the reason for the request. We will review the commercial record and confirm the outcome in writing.</p>

        <h2>Separate agreements</h2>
        <p>A signed proposal, enterprise agreement, business license, statement of work, or other written commercial agreement may contain different cancellation or refund terms. Those agreed terms take priority for that engagement.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
