import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { commercePlans } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Pricing",
  description: "AgentSiraji Commerce pricing for Bangladesh and international businesses.",
};

export default function PricingPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Commerce first</span>
          <span className="kicker">AgentSiraji pricing</span>
          <h1>Clear plans.<br /><em>No mystery around the starting cost.</em></h1>
          <p>AgentSiraji Commerce is the first product available for commercial purchase. LeadPilot and AdIntel will receive their own pricing when their release boundaries and usage costs are validated.</p>
        </div>
        <div className="product-monogram">PR<span>Pricing</span></div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div><span className="kicker">Bangladesh + international</span><h2>Managed Commerce.<br /><em>Choose your starting point.</em></h2></div>
          <p>Each managed plan has a one-time setup component and an ongoing platform subscription. Market-specific checkout determines currency and payment method.</p>
        </div>
        <div className="product-grid">
          {commercePlans.map((plan, index) => (
            <article className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`} key={plan.id}>
              <div className="card-top"><span className="status">{plan.highlight ? "Most popular" : "Commerce"}</span><span className="card-num">0{index + 1}</span></div>
              <div className="product-copy">
                <span className="product-label">{plan.bestFor}</span>
                <h3>{plan.name}</h3>
                <p><strong>Bangladesh</strong><br />{plan.setup.bd} setup<br />{plan.monthly.bd}</p>
                <p><strong>International</strong><br />{plan.setup.international} setup<br />{plan.monthly.international}</p>
                <Link href={`/checkout/commerce?plan=${plan.id}`}>Choose {plan.name} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-band shell">
        <article><b>BD</b><h3>Online payment</h3><p>SSLCOMMERZ will run in sandbox first and move to production only after merchant approval and release testing.</p></article>
        <article><b>BD</b><h3>Bank transfer</h3><p>Manual bank transfer is supported with admin verification. Uploading proof never activates a subscription by itself.</p></article>
        <article><b>INTL</b><h3>Global checkout</h3><p>Paddle sandbox is the planned subscription route; larger B2B engagements can use a verified manual invoice flow.</p></article>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Self-hosting or special commercial requirements</span>
          <h2>Need a business<br /><em>license arrangement?</em></h2>
          <p>Business License terms will be handled separately so source-code usage, support, hosting, update rights, and resale restrictions stay explicit.</p>
          <Link className="button button-primary button-large" href="/contact">Contact sales →</Link>
        </div>
        <div className="contact-shape"><span>AS</span></div>
      </section>
      <SiteFooter />
    </main>
  );
}
