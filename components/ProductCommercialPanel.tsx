import Link from "next/link";
import {
  activeDisplayPrice,
  formatCommercialPrice,
  type PublicCommercialOffer,
} from "@/lib/public-commercial";

function marketLabel(market: string) {
  if (market === "BD") return "Bangladesh";
  if (market === "INTL") return "International";
  if (market === "EMERGING") return "Emerging markets";
  return market;
}

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

function priceLine(offer: PublicCommercialOffer) {
  const current = activeDisplayPrice(offer);
  const unit = offer.billingUnit ? `/${offer.billingUnit}` : "";
  return `${formatCommercialPrice(offer.currency, current)}${unit}`;
}

export function ProductCommercialPanel({
  offers,
  productName,
}: {
  offers: PublicCommercialOffer[];
  productName: string;
}) {
  const grouped = new Map<string, PublicCommercialOffer[]>();
  for (const offer of offers) {
    const current = grouped.get(offer.planCode) ?? [];
    current.push(offer);
    grouped.set(offer.planCode, current);
  }
  const plans = [...grouped.values()];

  return (
    <section className="products shell section commerce-plans">
      <div className="section-heading">
        <div>
          <span className="kicker">Plans</span>
          <h2>Choose the plan.<br /><em>See every market price clearly.</em></h2>
        </div>
        <p>
          Pricing is controlled from AgentSiraji Admin. Displayed prices can be prepared before sales are enabled, while payment-provider billing stays separately controlled.
        </p>
      </div>

      {offers.length === 0 ? (
        <article className="product-card lead-card">
          <div className="product-copy">
            <span className="product-label">Not priced yet</span>
            <h3>{productName}</h3>
            <p>The commercial format is ready, but no public pricing row has been configured yet.</p>
            <Link className="button button-secondary" href="/contact">Ask about early access →</Link>
          </div>
        </article>
      ) : (
        <div className="product-grid">
          {plans.map((planOffers, index) => {
            const primary = planOffers[0];
            const allSalesEnabled = planOffers.every((offer) => offer.salesEnabled);
            const includes = Object.entries(primary.usageLimits ?? {})
              .map(([key, value]) => humanizeLimit(key, value))
              .filter((item): item is string => Boolean(item));

            return (
              <article className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`} key={primary.planCode}>
                <div className="card-top">
                  <span className="status">{allSalesEnabled ? "Available" : "Launch preparation"}</span>
                  <span className="card-num">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="product-copy plan-copy">
                  <span className="product-label">{productName}</span>
                  <h3>{primary.planName}</h3>
                  <div className="plan-pricing">
                    {planOffers.map((offer) => {
                      const current = activeDisplayPrice(offer);
                      const hasActiveOffer = offer.offerEnabled && offer.offerPrice != null && current === offer.offerPrice;
                      return (
                        <div key={offer.market}>
                          <p><strong>{marketLabel(offer.market)}:</strong> {priceLine(offer)}</p>
                          {hasActiveOffer && offer.regularPrice != null ? (
                            <p><small>Regular: {formatCommercialPrice(offer.currency, offer.regularPrice)}</small></p>
                          ) : null}
                          {offer.annualPrice != null ? (
                            <p><small>Annual: {formatCommercialPrice(offer.currency, offer.annualPrice)}</small></p>
                          ) : null}
                          {offer.offerUnitLabel ? <p><small>{offer.offerUnitLabel}</small></p> : null}
                        </div>
                      );
                    })}
                  </div>
                  {includes.length > 0 ? (
                    <>
                      <strong className="plan-includes-title">Included</strong>
                      <div className="plan-includes">
                        {includes.map((item) => <span key={item}>✓ {item}</span>)}
                      </div>
                    </>
                  ) : null}
                  <Link className="button button-primary" href="/contact">
                    {allSalesEnabled ? `Start with ${primary.planName} →` : "Join early access →"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
