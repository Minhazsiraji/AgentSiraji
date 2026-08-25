import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { commercePlans } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "AgentSiraji Commerce",
  description: "A high-performance managed e-commerce platform for ambitious businesses in Bangladesh and worldwide.",
};

export default function CommercePage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Available now</span>
          <span className="kicker">Managed commerce</span>
          <h1>Your brand.<br /><em>Proven commerce underneath.</em></h1>
          <p>AgentSiraji Commerce gives businesses a production-ready storefront foundation, managed delivery, and a clear path from launch to growth—without starting the technology stack from zero.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/pricing">See Commerce pricing →</Link>
            <a className="text-link" href="https://sirajibd.com" target="_blank" rel="noreferrer">Open live reference store <span>↗</span></a>
          </div>
        </div>
        <div className="product-monogram">CO<span>Commerce</span></div>
      </section>

      <section className="feature-band shell">
        <article><b>01</b><h3>Launch</h3><p>Start from a proven commerce foundation instead of rebuilding common store infrastructure.</p></article>
        <article><b>02</b><h3>Operate</h3><p>Manage products, inventory, checkout, orders, customer communication, and core store operations.</p></article>
        <article><b>03</b><h3>Grow</h3><p>Use a fast, SEO-ready storefront designed to connect with the wider AgentSiraji product ecosystem.</p></article>
      </section>

      <section className="product-story shell">
        <span className="kicker">The model</span>
        <h2>Managed first.<br /><em>Flexible when your business grows.</em></h2>
        <p>Your business owns its domain, brand, content, products, and customer data. AgentSiraji manages the core commerce platform, deployment, shared improvements, and the technical foundation under the managed plans.</p>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div><span className="kicker">Plans</span><h2>Start where you are.<br /><em>Know exactly what is included.</em></h2></div>
          <p>Every package shows its included service scope before checkout so customers can compare Starter, Growth, and Pro with confidence.</p>
        </div>
        <div className="product-grid">
          {commercePlans.map((plan, index) => (
            <article className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`} key={plan.id}>
              <div className="card-top"><span className="status">{plan.highlight ? "Most popular" : "Managed plan"}</span><span className="card-num">0{index + 1}</span></div>
              <div className="product-copy">
                <span className="product-label">{plan.bestFor}</span>
                <h3>{plan.name}</h3>
                <p><strong>Bangladesh:</strong> {plan.setup.bd} setup + {plan.monthly.bd}</p>
                <p><strong>International:</strong> {plan.setup.international} setup + {plan.monthly.international}</p>
                <p><strong>Included:</strong></p>
                {plan.includes.map((item) => (
                  <p key={item}>✓ {item}</p>
                ))}
                <Link className="button button-primary" style={{ fontSize: "15px" }} href={`/checkout/commerce?plan=${plan.id}`}>Start with {plan.name} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Need a different commercial model?</span>
          <h2>Managed by default.<br /><em>Business license by conversation.</em></h2>
          <p>For businesses that require self-hosting or a separate license arrangement, we will scope the license, support boundary, and usage rights explicitly rather than mixing it into the standard subscription checkout.</p>
          <Link className="button button-primary button-large" href="/contact">Talk to AgentSiraji →</Link>
        </div>
        <div className="contact-shape"><span>CO</span></div>
      </section>
      <SiteFooter />
    </main>
  );
}
