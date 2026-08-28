import type { Metadata } from "next";
import Link from "next/link";
import { ProductCommercialPanel } from "@/components/ProductCommercialPanel";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getPublicCommercialProducts } from "@/lib/public-commercial";

export const metadata: Metadata = {
  title: "AgentSiraji LeadPilot",
  description: "Bring customer leads and conversations into a clearer workflow so teams can reply faster and move more orders forward.",
};

export default async function LeadPilotPage() {
  const commercial = await getPublicCommercialProducts();
  const leadPilot = commercial.find((product) => product.code === "leadpilot");

  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Coming soon</span>
          <span className="kicker">Lead & order conversion</span>
          <h1>Capture demand.<br /><em>Move conversations forward.</em></h1>
          <p>LeadPilot is being built to bring customer leads and conversations from supported channels into one focused workflow so teams can respond faster and move more orders forward.</p>
          <Link className="button button-primary" href="#leadpilot-pricing">Commercial status →</Link>
        </div>
        <div className="product-monogram">LP<span>LeadPilot</span></div>
      </section>

      <section className="feature-band shell">
        <article><b>01</b><h3>Capture</h3><p>Bring supported lead sources and customer conversations into a clearer operating view.</p></article>
        <article><b>02</b><h3>Respond</h3><p>Help teams reply faster with structured workflows and assisted responses where appropriate.</p></article>
        <article><b>03</b><h3>Convert</h3><p>Track intent, order progress, and the next action needed to move a conversation toward confirmation.</p></article>
      </section>

      <div id="leadpilot-pricing">
        <ProductCommercialPanel offers={leadPilot?.offers ?? []} productName="AgentSiraji LeadPilot" />
      </div>

      <section className="product-story shell">
        <span className="kicker">The role in AgentSiraji</span>
        <h2>Commerce helps you sell.<br /><em>LeadPilot helps you convert.</em></h2>
        <p>The universal pricing format already supports LeadPilot, but the product can remain unpriced and inactive until release boundaries, channel costs, and AI/API limits are verified.</p>
      </section>
      <SiteFooter />
    </main>
  );
}
