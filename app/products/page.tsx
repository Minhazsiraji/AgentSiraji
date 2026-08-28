import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { products } from "@/lib/catalog";
import { getPublicCommercialProducts } from "@/lib/public-commercial";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore AgentSiraji Commerce, LeadPilot, AdIntel, and private AgentSiraji Labs products.",
};

function statusLabel(status: string) {
  if (status === "available") return "Available";
  if (status === "coming-soon") return "Coming soon";
  return "AgentSiraji Labs";
}

export default async function ProductsPage() {
  const commercial = await getPublicCommercialProducts();
  const commercialMap = new Map(commercial.map((product) => [product.code, product]));

  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">AgentSiraji product system</span>
          <span className="kicker">Sell · Convert · Grow · Labs</span>
          <h1>Focused products.<br /><em>One commercial foundation.</em></h1>
          <p>
            Each AgentSiraji product solves a specific business problem while sharing a central commercial, support, security, and future billing foundation.
          </p>
        </div>
        <div className="product-monogram">AS<span>Product suite</span></div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Current portfolio</span>
            <h2>Choose the problem.<br /><em>Open the right product.</em></h2>
          </div>
          <p>Products can be fully available, commercially configured but not yet on sale, or intentionally private while under development.</p>
        </div>

        <div className="product-grid">
          {products.map((product, index) => {
            const commercialProduct = commercialMap.get(product.slug);
            const pricingReady = Boolean(commercialProduct?.offers.length);
            return (
              <article className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`} key={product.slug}>
                <div className="card-top">
                  <span className="status">{statusLabel(product.status)}</span>
                  <span className="card-num">0{index + 1}</span>
                </div>
                <div className="product-copy">
                  <span className="product-label">{product.pillar} · {product.category}</span>
                  <h3>{product.shortName}</h3>
                  <p>{product.summary}</p>
                  <p><strong>Commercial setup:</strong> {pricingReady ? "Pricing rows configured" : "Format ready — price not set yet"}</p>
                  <Link className="button button-primary" href={`/products/${product.slug}`}>Explore {product.shortName} →</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Not sure which product fits?</span>
          <h2>Tell us the bottleneck.<br /><em>We’ll point you to the right tool.</em></h2>
          <p>AgentSiraji is built as a growing product family, so future products can be added without rebuilding the commercial structure.</p>
          <Link className="button button-primary button-large" href="/contact">Contact AgentSiraji →</Link>
        </div>
        <div className="contact-shape"><span>AS</span></div>
      </section>
      <SiteFooter />
    </main>
  );
}
