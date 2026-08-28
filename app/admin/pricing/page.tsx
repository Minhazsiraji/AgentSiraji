import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CommercialPricingAdmin } from "@/components/CommercialPricingAdmin";

export const metadata: Metadata = {
  title: "Products & Pricing Admin",
  description: "AgentSiraji internal product pricing, offers and usage configuration.",
  robots: { index: false, follow: false },
};

export default function CommercialPricingAdminPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Internal commercial control</span>
          <span className="kicker">AgentSiraji Products & Pricing</span>
          <h1>
            One pricing system.
            <br />
            <em>Every product, including future products.</em>
          </h1>
          <p>
            Set regular prices, offer prices, annual prices, billing units, offer windows,
            usage limits and sales availability without editing application code. Products
            can remain unpriced and inactive until they are commercially ready.
          </p>
        </div>
        <div className="product-monogram">
          PP
          <span>Pricing admin</span>
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Safe commercial configuration</span>
            <h2>
              Edit the offer.
              <br />
              <em>Keep provider billing controlled.</em>
            </h2>
          </div>
          <p>
            Display and offer configuration is intentionally separate from payment-provider
            billing. Turning on an offer here does not silently change a Paddle or SSLCOMMERZ
            provider price.
          </p>
        </div>
        <CommercialPricingAdmin />
      </section>
      <SiteFooter />
    </main>
  );
}
