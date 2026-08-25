import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { commercePlans } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Commerce Pricing",
  description: "Compare AgentSiraji Commerce Starter, Growth, and Pro pricing for Bangladesh and international businesses.",
};

export default function PricingPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Commerce first</span>
          <span className="kicker">AgentSiraji pricing</span>
          <h1>Clear plans.<br /><em>Know what you pay for.</em></h1>
          <p>AgentSiraji Commerce is the first product available for commercial purchase. Compare the standard managed scope before choosing a market and payment route.</p>
        </div>
        <div className="product-monogram">PR<span>Pricing</span></div>
      </section>

      <section className="products shell section commerce-plans">
        <div className="section-heading">
          <div><span className="kicker">Bangladesh + international</span><h2>Managed Commerce.<br /><em>Choose your starting point.</em></h2></div>
          <p>Every plan combines a one-time setup component with an ongoing managed-service fee. Package scope remains visible before checkout.</p>
        </div>
        <div className="product-grid">
          {commercePlans.map((plan, index) => (
            <article className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`} key={plan.id}>
              <div className="card-top"><span className="status">{plan.highlight ? "Most popular" : "Managed plan"}</span><span className="card-num">0{index + 1}</span></div>
              <div className="product-copy plan-copy">
                <span className="product-label">{plan.bestFor}</span>
                <h3>{plan.name}</h3>
                <div className="plan-pricing">
                  <p><strong>Bangladesh:</strong> {plan.setup.bd} setup + {plan.monthly.bd}</p>
                  <p><strong>International:</strong> {plan.setup.international} setup + {plan.monthly.international}</p>
                </div>
                <strong className="plan-includes-title">Included</strong>
                <div className="plan-includes">
                  {plan.includes.map((item) => <span key={item}>✓ {item}</span>)}
                </div>
                <Link className="button button-primary" href={`/checkout/commerce?plan=${plan.id}`}>Choose {plan.name} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-band shell">
        <article><b>BD</b><h3>Online payment</h3><p>SSLCOMMERZ is verified in sandbox. Live checkout remains locked until production merchant credentials and launch approval are complete.</p></article>
        <article><b>BD</b><h3>Bank transfer</h3><p>Manual bank transfer uses an independent admin review. Uploading or submitting payment proof never activates service by itself.</p></article>
        <article><b>INTL</b><h3>Global checkout</h3><p>Paddle sandbox is verified for Starter, Growth, and Pro. Larger B2B engagements can use a controlled manual invoice flow.</p></article>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Self-hosting or special commercial requirements</span>
          <h2>Need a business<br /><em>license arrangement?</em></h2>
          <p>Business License terms are handled separately so source-code usage, support, hosting, update rights, and resale restrictions stay explicit.</p>
          <Link className="button button-primary button-large" href="/contact">Contact sales →</Link>
        </div>
        <div className="contact-shape"><span>AS</span></div>
      </section>
      <SiteFooter />
    </main>
  );
}
