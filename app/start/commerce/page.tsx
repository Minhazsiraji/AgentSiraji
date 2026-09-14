import type { Metadata } from "next";
import Link from "next/link";
import { CommercePlanIntentForm } from "@/components/CommercePlanIntentForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { commercePlans } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Start AgentSiraji Commerce",
  description: "Choose Starter, Growth, or Pro and send a direct AgentSiraji Commerce onboarding request without making a payment yet.",
};

type Props = { searchParams: Promise<{ plan?: string }> };

export default async function StartCommercePage({ searchParams }: Props) {
  const params = await searchParams;
  const selected = commercePlans.find((plan) => plan.id === params.plan) ?? commercePlans[0];

  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Direct onboarding</span>
          <span className="kicker">AgentSiraji Commerce — {selected.name}</span>
          <h1>Choose your plan.<br /><em>Start the real onboarding.</em></h1>
          <p>You already know the package you want, so you do not need to complete a Store Audit first. Send the short request below and AgentSiraji will confirm scope and payment instructions before anything is charged.</p>
          <div className="hero-actions">
            <Link className="text-link" href="/store-audit">Not sure yet? Get a free store audit <span>↗</span></Link>
          </div>
        </div>
        <div className="product-monogram">{selected.name.slice(0, 2).toUpperCase()}<span>{selected.name}</span></div>
      </section>

      <section className="contact-layout shell">
        <div>
          <span className="kicker">Selected starting point</span>
          <h2>{selected.name}<br /><em>{selected.bestFor}</em></h2>
          <CommercePlanIntentForm plans={commercePlans} initialPlan={selected.id} />
        </div>
        <aside>
          <span className="kicker">What happens next</span>
          <div className="contact-note"><strong>1. Request saved</strong><p>Your selected package and business details enter the AgentSiraji sales pipeline.</p></div>
          <div className="contact-note"><strong>2. Scope confirmed</strong><p>We confirm your store requirements and any plan-specific details before asking for payment.</p></div>
          <div className="contact-note"><strong>3. Payment verified</strong><p>Bangladesh pilot customers receive the verified bKash instruction. Service activates only after owner verification.</p></div>
          <div className="contact-note"><strong>4. Account activated</strong><p>Your Commerce account is provisioned and you receive passwordless sign-in access.</p></div>
        </aside>
      </section>

      <section className="contact shell">
        <div className="contact-inner">
          <span className="kicker">Need help choosing?</span>
          <h2>Still comparing plans?<br /><em>Use the free Store Audit.</em></h2>
          <p>The audit remains available for businesses that want a recommendation before selecting Starter, Growth, or Pro.</p>
          <Link className="button button-primary button-large" href="/store-audit">Get Free Store Audit →</Link>
        </div>
        <div className="contact-shape"><span>CO</span></div>
      </section>
      <SiteFooter />
    </main>
  );
}
