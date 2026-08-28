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

export function ProductCommercialPanel({
  offers,
  productName,
}: {
  offers: PublicCommercialOffer[];
  productName: string;
}) {
  return (
    <section className="products shell section commerce-plans">
      <div className="section-heading">
        <div>
          <span className="kicker">Commercial configuration</span>
          <h2>Pricing when ready.<br /><em>Controlled from AgentSiraji Admin.</em></h2>
        </div>
        <p>
          Public prices are read from the central AgentSiraji commercial configuration. Offer display and live payment-provider billing remain separate controls.
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
          {offers.map((offer) => {
            const current = activeDisplayPrice(offer);
            const hasActiveOffer = offer.offerEnabled && offer.offerPrice != null && current === offer.offerPrice;
            return (
              <article className="product-card lead-card" key={`${offer.planCode}-${offer.market}`}>
                <div className="card-top">
                  <span className="status">{offer.salesEnabled ? "Sales enabled" : "Pricing configured"}</span>
                  <span className="card-num">{marketLabel(offer.market)}</span>
                </div>
                <div className="product-copy plan-copy">
                  <span className="product-label">{offer.planName}</span>
                  <h3>{formatCommercialPrice(offer.currency, current)}<small> / {offer.billingUnit}</small></h3>
                  {hasActiveOffer && offer.regularPrice != null ? (
                    <p><strong>Regular:</strong> {formatCommercialPrice(offer.currency, offer.regularPrice)}</p>
                  ) : null}
                  {offer.annualPrice != null ? (
                    <p><strong>Annual:</strong> {formatCommercialPrice(offer.currency, offer.annualPrice)}</p>
                  ) : null}
                  {offer.offerUnitLabel ? <p><strong>Offer:</strong> {offer.offerUnitLabel}</p> : null}
                  <p>{offer.salesEnabled ? "This pricing row is commercially enabled." : "Pricing is visible for launch preparation; purchasing is not enabled from this row yet."}</p>
                  <Link className="button button-primary" href={offer.salesEnabled ? "/contact" : "/contact"}>
                    {offer.salesEnabled ? "Get started →" : "Join early access →"}
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
