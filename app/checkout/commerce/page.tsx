import type { Metadata } from "next";
import Link from "next/link";
import { PaddleInitializer } from "@/components/PaddleInitializer";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CommerceCheckoutForm } from "@/components/CommerceCheckoutForm";
import { checkoutRoutes } from "@/lib/billing";
import { commercePlans } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Commerce Checkout",
  description: "Choose a market and test payment route for AgentSiraji Commerce.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ plan?: string }> };

export default async function CommerceCheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const selected =
    commercePlans.find((plan) => plan.id === params.plan) ?? commercePlans[0];
  const bdRoutes = checkoutRoutes.filter((route) => route.market === "bd");
  const internationalRoutes = checkoutRoutes.filter(
    (route) => route.market === "international",
  );

  return (
    <main>
      <PaddleInitializer />
      <SiteHeader />

      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Test checkout</span>
          <span className="kicker">AgentSiraji Commerce — {selected.name}</span>
          <h1>
            Choose your market.
            <br />
            <em>Then choose how to pay.</em>
          </h1>
          <p>
            This checkout is intentionally in launch-preparation mode. Sandbox
            payments can exercise the complete verification flow, while manual
            submissions can never activate service without authorized approval.
          </p>
        </div>
        <div className="product-monogram">
          {selected.name.slice(0, 2).toUpperCase()}
          <span>{selected.name}</span>
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Interactive test</span>
            <h2>
              Exercise the rules.
              <br />
              <em>Without moving live money.</em>
            </h2>
          </div>
          <p>
            The simulator uses the same market, provider, and activation trust
            boundaries intended for launch, while payment providers remain in
            sandbox mode.
          </p>
        </div>
        <div className="product-grid">
          <CommerceCheckoutForm
            plans={commercePlans}
            routes={checkoutRoutes}
            initialPlan={selected.id}
          />
          <article className="product-card diary-card">
            <div className="card-top">
              <span className="status light">Trust boundary</span>
              <span className="card-num">02</span>
            </div>
            <div className="product-copy">
              <span className="product-label">Activation protection</span>
              <h3>Payment proof is never access.</h3>
              <p>
                SSLCOMMERZ and Paddle require verified server-side payment events.
                Bangladesh bank transfer and manual B2B invoice require authorized
                AgentSiraji approval after receipt verification.
              </p>
              <p>
                <strong>Result:</strong> redirects, screenshots, and unverified
                callbacks cannot activate Commerce.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Bangladesh</span>
            <h2>
              {selected.setup.bd} setup
              <br />
              <em>+ {selected.monthly.bd}</em>
            </h2>
          </div>
          <p>
            Bangladesh supports automated online payment plus a controlled manual
            bank-transfer path for B2B customers.
          </p>
        </div>
        <div className="product-grid">
          {bdRoutes.map((route, index) => (
            <article
              className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`}
              key={route.provider}
            >
              <div className="card-top">
                <span className="status">
                  {route.mode === "sandbox" ? "Sandbox" : "Manual test"}
                </span>
                <span className="card-num">0{index + 1}</span>
              </div>
              <div className="product-copy">
                <span className="product-label">Bangladesh payment</span>
                <h3>{route.label}</h3>
                <p>{route.description}</p>
                <p>
                  <strong>Activation:</strong>{" "}
                  {route.autoActivatesAfterVerifiedPayment
                    ? "Only after verified gateway payment."
                    : "Only after authorized AgentSiraji admin approval."}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">International</span>
            <h2>
              {selected.setup.international} setup
              <br />
              <em>+ {selected.monthly.international}</em>
            </h2>
          </div>
          <p>
            International checkout uses Paddle sandbox subscriptions plus a manual
            B2B invoice route for larger engagements.
          </p>
        </div>
        <div className="product-grid">
          {internationalRoutes.map((route, index) => (
            <article
              className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`}
              key={route.provider}
            >
              <div className="card-top">
                <span className="status">
                  {route.mode === "sandbox" ? "Sandbox" : "Manual test"}
                </span>
                <span className="card-num">0{index + 1}</span>
              </div>
              <div className="product-copy">
                <span className="product-label">International payment</span>
                <h3>{route.label}</h3>
                <p>{route.description}</p>
                <p>
                  <strong>Activation:</strong>{" "}
                  {route.autoActivatesAfterVerifiedPayment
                    ? "Only after verified provider event."
                    : "Only after authorized AgentSiraji verification."}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Launch preparation</span>
          <h2>
            Payment foundations verified.
            <br />
            <em>Live money remains off.</em>
          </h2>
          <p>
            Sandbox gateway verification, commercial records, and activation trust
            boundaries are connected. Production credentials remain intentionally
            disabled until the launch gates are complete.
          </p>
          <Link className="button button-primary button-large" href="/contact">
            Talk to sales →
          </Link>
        </div>
        <div className="contact-shape">
          <span>CO</span>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
