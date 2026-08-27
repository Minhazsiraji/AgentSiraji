import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ForeignOutreachConsole } from "@/components/ForeignOutreachConsole";

export const metadata: Metadata = {
  title: "Foreign Outreach | AgentSiraji Sales",
  description: "Private AgentSiraji foreign-client outreach workspace.",
  robots: { index: false, follow: false },
};

export default function ForeignOutreachPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return (
    <main>
      <SiteHeader />

      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Internal preview tool</span>
          <span className="kicker">AgentSiraji Sales Operations</span>
          <h1>
            Foreign outreach.
            <br />
            <em>Run it like a sales system.</em>
          </h1>
          <p>
            Research qualified overseas SMEs, prepare personalized outreach, keep
            every follow-up in one queue, and let real reply and close rates decide
            which countries AgentSiraji should scale.
          </p>
        </div>
        <div className="product-monogram">
          FO
          <span>Foreign outreach</span>
        </div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">Human-approved outbound</span>
            <h2>
              AI prepares the work.
              <br />
              <em>You approve the send.</em>
            </h2>
          </div>
          <p>
            This workspace never mass-sends platform DMs. It stores prospect
            research, prepared messages, send history, follow-ups, pipeline stages,
            partner leads, and country performance while keeping the final outreach
            action under human control.
          </p>
        </div>

        <ForeignOutreachConsole />
      </section>

      <SiteFooter />
    </main>
  );
}
