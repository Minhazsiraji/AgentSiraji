import type { Metadata } from "next";
import Link from "next/link";
import { ProductCommercialPanel } from "@/components/ProductCommercialPanel";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getPublicCommercialProducts } from "@/lib/public-commercial";

export const metadata: Metadata = {
  title: "AgentSiraji AdIntel",
  description: "Advertising intelligence for researching patterns, understanding what works, and creating stronger original campaigns.",
};

export default async function AdIntelPage() {
  const commercial = await getPublicCommercialProducts();
  const adIntel = commercial.find((product) => product.code === "adintel");

  return (
    <main>
      <SiteHeader />
      <section className="product-hero diary-product shell">
        <div>
          <span className="status">Launch preparation</span>
          <span className="kicker">Advertising intelligence</span>
          <h1>Research what works.<br /><em>Create something better.</em></h1>
          <p>AdIntel helps businesses research advertising patterns by market, understand campaign signals, and turn those findings into stronger original creative directions.</p>
          <Link className="button button-primary" href="#adintel-pricing">See AdIntel pricing →</Link>
        </div>
        <div className="product-monogram">AI<span>AdIntel</span></div>
      </section>

      <section className="feature-band shell">
        <article><b>01</b><h3>Research</h3><p>Search relevant advertising examples, markets, countries, and patterns through the supported research workflow.</p></article>
        <article><b>02</b><h3>Understand</h3><p>Break down hooks, positioning, creative structure, landing signals, and other campaign intelligence.</p></article>
        <article><b>03</b><h3>Create</h3><p>Use Creative Lab and intelligence signals to develop stronger original campaign directions instead of copying competitors.</p></article>
      </section>

      <div id="adintel-pricing">
        <ProductCommercialPanel
          offers={adIntel?.offers ?? []}
          productName="AgentSiraji AdIntel"
          checkoutBaseHref="/checkout/adintel"
        />
      </div>

      <section className="product-story shell">
        <span className="kicker">Commercial release gate</span>
        <h2>Pricing can be ready.<br /><em>Sales can stay safely off.</em></h2>
        <p>AgentSiraji separates displayed commercial configuration from payment-provider billing. This lets us prepare Bangladesh and international pricing before live checkout is authorized.</p>
      </section>
      <SiteFooter />
    </main>
  );
}
