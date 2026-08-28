import type { Metadata } from "next";
import Link from "next/link";
import { ProductCommercialPanel } from "@/components/ProductCommercialPanel";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { commercePlans, products } from "@/lib/catalog";
import { getPublicCommercialProducts } from "@/lib/public-commercial";

export const metadata: Metadata = {
  title: "AgentSiraji Pricing",
  description: "AgentSiraji product pricing for Commerce, AdIntel, LeadPilot, and future commercial products.",
};

export default async function PricingPage() {
  const commercial = await getPublicCommercialProducts();
  const commercialMap = new Map(commercial.map((product) => [product.code, product]));

  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Central commercial system</span>
          <span className="kicker">AgentSiraji pricing</span>
          <h1>One pricing system.<br /><em>Every product can grow into it.</em></h1>
          <p>Commerce is already commercially structured. AdIntel pricing is prepared through the central admin, while other products can remain unpriced until they are ready.</p>
        </div>
        <div className="product-monogram">PR<span>Pricing</span></div>
      </section>

      <section className="products shell section commerce-plans">
        <div className="section-heading">
          <div><span className="kicker">Commerce</span><h2>Managed Commerce.<br /><em>Choose your starting point.</em></h2></div>
          <p>Commerce currently uses its verified package catalog for checkout. Provider billing remains separately controlled from future universal display offers.</p>
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

      {products.filter((product) => product.slug !== "commerce").map((product) => (
        <ProductCommercialPanel
          key={product.slug}
          productName={product.name}
          offers={commercialMap.get(product.slug)?.offers ?? []}
        />
      ))}

      <section className="feature-band shell">
        <article><b>ADMIN</b><h3>Editable offers</h3><p>Regular, offer and annual prices, billing units, offer windows, markets and usage limits can be managed centrally.</p></article>
        <article><b>SAFE</b><h3>Billing stays separate</h3><p>Changing a displayed offer does not silently change Paddle or SSLCOMMERZ provider billing.</p></article>
        <article><b>FUTURE</b><h3>Unpriced is valid</h3><p>New products can exist in the catalog with the commercial format ready while pricing remains intentionally unset.</p></article>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Special commercial requirements</span>
          <h2>Need a custom<br /><em>business arrangement?</em></h2>
          <p>Business License terms, larger team requirements, and special implementation needs are handled separately so commercial rights and support stay explicit.</p>
          <Link className="button button-primary button-large" href="/contact">Contact sales →</Link>
        </div>
        <div className="contact-shape"><span>AS</span></div>
      </section>
      <SiteFooter />
    </main>
  );
}
