import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about AgentSiraji Commerce, pricing, payments, support, product availability, and working with AgentSiraji.",
};

const faqs = [
  ["What is available to buy now?", "AgentSiraji Commerce is the first commercial product. It is a managed e-commerce platform offered in Starter, Growth, and Pro plans. LeadPilot and AdIntel are coming later, while Doctor's Diary remains a private healthcare project and is not currently for public sale."],
  ["What is included in a Commerce plan?", "Each plan publishes its included scope before checkout. Starter covers the core managed store foundation, Growth adds more capacity and advanced merchandising and integrations, and Pro adds priority implementation, support, and advanced requirements."],
  ["Why is there a setup fee and a monthly fee?", "The setup fee covers launch and customer-specific implementation work. The monthly fee covers the ongoing managed platform service, including the plan's maintenance, hosting and support scope."],
  ["How can customers pay in Bangladesh?", "Bangladesh customers can use the supported online gateway or a controlled bank-transfer process. Manual payment proof only requests review; service activates only after authorized verification."],
  ["How can international customers pay?", "International checkout is designed around Paddle for standard managed plans, with a manual B2B invoice path available for appropriate larger engagements. Live payment credentials remain disabled until production launch gates are complete."],
  ["Does a payment receipt or success screen activate service?", "No. Access is controlled by verified server-side payment state or authorized manual approval. A browser success screen, screenshot, uploaded receipt, or payment claim never creates access by itself."],
  ["Can I cancel a Commerce subscription?", "Yes. Cancellation can be requested before the next billing cycle. Refund eligibility depends on whether setup or service work has already started and on any separate written agreement. See the Refund & Cancellation Policy for the standard rules."],
  ["Who owns my brand, products, and customer data?", "The customer retains ownership of their own brand assets, business content, product information, and customer data. AgentSiraji retains its platform code, shared systems, reusable components, methods, and product intellectual property unless a separate written agreement states otherwise."],
  ["Can the system grow later?", "Yes. AgentSiraji Commerce is intentionally built on adaptable foundations so integrations, payment providers, workflows, analytics, and other capabilities can evolve without rebuilding the entire platform."],
  ["Do you work outside Bangladesh?", "Yes. AgentSiraji serves Bangladesh and international customers. Pricing and payment routes are shown separately so the commercial model is clear for each market."],
  ["What if I need self-hosting or a separate business license?", "That is handled as a separate commercial arrangement rather than mixed into the normal managed subscription. Source-code usage, hosting, updates, support, and resale restrictions are defined explicitly in writing."],
  ["How do we start?", "Choose a Commerce plan or contact AgentSiraji with your business goal and requirements. If the standard plan is a fit, checkout and onboarding follow the published flow; unusual requirements are scoped separately."],
] as const;

export default function FaqPage() {
  return (
    <main>
      <SiteHeader />
      <section className="subhero shell">
        <span className="kicker">FAQ</span>
        <h1>Useful answers.<br /><em>No sales theatre.</em></h1>
        <p>A direct guide to Commerce plans, payments, ownership, support, and AgentSiraji product availability.</p>
      </section>
      <section className="faq-list shell">
        {faqs.map(([question, answer], index) => (
          <details key={question}>
            <summary><span>{String(index + 1).padStart(2, "0")}</span><h2>{question}</h2><b>+</b></summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
      <section className="mini-cta shell">
        <div><span className="kicker">Need a specific answer?</span><h2>Ask directly.</h2></div>
        <Link className="button button-primary" href="/contact">Contact AgentSiraji →</Link>
      </section>
      <SiteFooter />
    </main>
  );
}
