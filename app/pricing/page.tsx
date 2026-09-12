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
          <span className="status">Launch pilot</span>
          <span className="kicker">AgentSiraji pricing</span>
          <h1>Clear plans.<br /><em>Know what you pay for.</em></h1>
          <p>Compare the standard managed scope, then start with the free Store Audit. During the current pilot, qualification and onboarding are handled directly rather than through live gateway checkout.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/store-audit">Get Free Store Audit →</Link>
            <Link className="text-link" href="/contact">Talk to AgentSiraji <span>↗</span></Link>
          </div>
        </div>
        <div className="product-monogram">PR<span>Pricing</span></div>
      </section>

      <section className="products shell section commerce-plans">
        <div className="section-heading">
          <div><span className="kicker">Bangladesh + international</span><h2>Managed Commerce.<br /><em>Choose your starting point.</em></h2></div>
          <p>Every plan combines a one-time setup component with an ongoing managed-service fee. The package scope is public; the current launch path begins with qualification.</p>
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
                <Link className="button button-primary" href="/store-audit">Check fit with a free audit →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-band shell">
        <article><b>BD</b><h3>SSLCOMMERZ</h3><p>Sandbox only. Production merchant activation is intentionally deferred.</p></article>
        <article><b>PILOT</b><h3>Direct onboarding</h3><p>Early local customers are qualified and onboarded directly by AgentSiraji before any payment step.</p></article>
        <article><b>INTL</b><h3>Paddle</h3><p>Sandbox only. Production international checkout remains intentionally deferred.</p></article>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Start with your current selling setup</span>
          <h2>Find the gaps.<br /><em>Then choose the plan.</em></h2>
          <p>Run the Store Audit first so the recommendation is based on your actual store, page, checkout and tracking setup.</p>
          <Link className="button button-primary button-large" href="/store-audit">Get Free Store Audit →</Link>
        </div>
        <div className="contact-shape"><span>AS</span></div>
      </section>
      <SiteFooter />
    </main>
  );
}
