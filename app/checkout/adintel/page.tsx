import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SubscriptionCheckoutForm } from "@/components/SubscriptionCheckoutForm";
import { checkoutRoutes } from "@/lib/billing";
import { getPublicCommercialProducts } from "@/lib/public-commercial";

export const metadata: Metadata = {
  title: "AdIntel Subscription Checkout",
  description: "Choose a market and payment route for an AgentSiraji AdIntel subscription.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ plan?: string }> };

function humanizeLimit(key: string, value: unknown) {
  const labels: Record<string, string> = {
    searches_per_month: "Research searches / month",
    daily_safety_cap: "Daily safety cap",
    ai_analyses_per_month: "AI analyses / month",
    saved_ads: "Saved ads",
    creative_lab: "Creative Lab",
    landing_intel: "Landing Intel",
    exports: "Exports",
    country_access: "Country access",
  };
  const label = labels[key] ?? key.replaceAll("_", " ");
  if (typeof value === "boolean") return value ? label : null;
  if (value === "all") return `${label}: All countries`;
  return `${label}: ${String(value)}`;
}

export default async function AdIntelCheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const commercial = await getPublicCommercialProducts();
  const adIntel = commercial.find((product) => product.code === "adintel");
  const offers = adIntel?.offers ?? [];
  const availablePlans = [...new Set(offers.map((offer) => offer.planCode))];
  const selectedPlan = availablePlans.includes(params.plan ?? "") ? String(params.plan) : availablePlans[0] ?? "pro";
  const primary = offers.find((offer) => offer.planCode === selectedPlan);
  const included = Object.entries(primary?.usageLimits ?? {})
    .map(([key, value]) => humanizeLimit(key, value))
    .filter((item): item is string => Boolean(item));

  return (
    <main>
      <SiteHeader />

      <section className="product-hero diary-product shell">
        <div>
          <span className="status">Subscription checkout preview</span>
          <span className="kicker">AgentSiraji AdIntel — {primary?.planName ?? "Pro"}</span>
          <h1>Choose your market.<br /><em>Then choose how to subscribe.</em></h1>
          <p>
            AdIntel uses the same AgentSiraji commercial trust boundary as Commerce: a customer chooses a plan and market, payment is verified server-side, and access is created only after verified payment or authorized manual approval.
          </p>
        </div>
        <div className="product-monogram">AI<span>AdIntel</span></div>
      </section>

      <section className="products shell section checkout-package-section">
        <div className="section-heading">
          <div>
            <span className="kicker">Selected subscription</span>
            <h2>{primary?.planName ?? "Pro"}<br /><em>Advertising intelligence access.</em></h2>
          </div>
          <p>
            Review the included usage allowance before payment. Pricing is read from AgentSiraji commercial configuration while provider billing remains independently controlled.
          </p>
        </div>

        {offers.length === 0 ? (
          <article className="product-card lead-card">
            <div className="product-copy">
              <span className="product-label">Checkout not configured</span>
              <h3>AdIntel</h3>
              <p>No commercial pricing rows are currently available for this checkout.</p>
              <Link className="button button-primary" href="/contact">Contact AgentSiraji →</Link>
            </div>
          </article>
        ) : (
          <div className="product-grid checkout-package-grid">
            <article className="product-card lead-card checkout-scope-card">
              <div className="card-top">
                <span className="status">Subscription scope</span>
                <span className="card-num">01</span>
              </div>
              <div className="product-copy checkout-scope-copy">
                <span className="product-label">What is included</span>
                <h3>{primary?.planName ?? "Pro"}</h3>
                <div className="checkout-scope-list">
                  {included.map((item) => <span key={item}>✓ {item}</span>)}
                </div>
              </div>
            </article>
            <SubscriptionCheckoutForm
              productCode="adintel"
              productName="AgentSiraji AdIntel"
              offers={offers}
              routes={checkoutRoutes}
              initialPlan={selectedPlan}
            />
          </div>
        )}
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Activation boundary</span>
            <h2>Payment starts the subscription.<br /><em>Verification grants access.</em></h2>
          </div>
          <p>
            Bangladesh gateway payment requires verified SSLCOMMERZ server validation. International recurring card billing requires a dedicated AdIntel Paddle price and verified webhook. Manual payment routes require authorized AgentSiraji review.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
