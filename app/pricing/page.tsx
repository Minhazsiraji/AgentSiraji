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
          <p>Compare the standard managed scope. If you already know the package you want, start that plan directly. If you are unsure, use the free Store Audit before onboarding.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#plans">Choose a plan →</Link>
            <Link className="text-link" href="/store-audit">Not sure? Get a free store audit <span>↗</span></Link>
          </div>
        </div>
        <div className="product-monogram">PR<span>Pricing</span></div>
      </section>

      <section className="products shell section commerce-plans" id="plans">
        <div className="section-heading">
          <div><span className="kicker">Bangladesh + international</span><h2>Managed Commerce.<br /><em>Choose your starting point.</em></h2></div>
          <p>Every plan combines a one-time setup component with an ongoing managed-service fee. Start directly when you know your package; payment still happens only after AgentSiraji confirms the project.</p>
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
                <div style={{ display: "grid", gap: 10 }}>
                  <Link className="button button-primary" href={`/start/commerce?plan=${plan.id}`}>Start {plan.name} →</Link>
                  <Link className="text-link" href="/store-audit">Not sure? Get a free store audit <span>↗</span></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-band shell">
        <article><b>BD</b><h3>Direct bKash pilot</h3><p>AgentSiraji confirms the project first, then provides the verified bKash payment instruction. Owner verification controls activation.</p></article>
        <article><b>PILOT</b><h3>Direct onboarding</h3><p>Early customers can select a plan and enter the sales pipeline immediately without completing a Store Audit first.</p></article>
        <article><b>INTL</b><h3>International enquiry</h3><p>International customers can select a plan directly; live Paddle checkout remains intentionally deferred until commercial launch gates are complete.</p></article>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Need help deciding?</span>
          <h2>Find the gaps.<br /><em>Then choose the plan.</em></h2>
          <p>The Store Audit remains available when you want a recommendation based on your actual store, page, checkout and tracking setup.</p>
          <Link className="button button-primary button-large" href="/store-audit">Get Free Store Audit →</Link>
        </div>
        <div className="contact-shape"><span>AS</span></div>
      </section>
      <SiteFooter />
    </main>
  );
}
