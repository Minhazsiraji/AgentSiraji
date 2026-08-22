import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "AgentSiraji AdIntel",
  description: "Advertising intelligence for researching patterns, understanding what works, and creating stronger original campaigns.",
};

export default function AdIntelPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero diary-product shell">
        <div>
          <span className="status">Coming soon</span>
          <span className="kicker">Advertising intelligence</span>
          <h1>Research what works.<br /><em>Create something better.</em></h1>
          <p>AdIntel is being designed to help businesses research advertising patterns for a product or market, understand the signals behind strong campaigns, and turn that learning into better original creative directions.</p>
          <Link className="button button-primary" href="/contact">Join early access →</Link>
        </div>
        <div className="product-monogram">AI<span>AdIntel</span></div>
      </section>

      <section className="feature-band shell">
        <article><b>01</b><h3>Search</h3><p>Explore relevant advertising examples and market patterns through compliant data sources.</p></article>
        <article><b>02</b><h3>Understand</h3><p>Break down positioning, hooks, creative structure, and other useful campaign signals.</p></article>
        <article><b>03</b><h3>Improve</h3><p>Turn research into original campaign concepts rather than copying another advertiser&apos;s work.</p></article>
      </section>

      <section className="product-story shell">
        <span className="kicker">Commercial release gate</span>
        <h2>Intelligence without shortcuts.<br /><em>Original work stays the goal.</em></h2>
        <p>Before public release, AgentSiraji will validate the advertising-data source, platform compliance, usage costs, and the credit model. Pricing will follow those verified economics rather than being guessed in advance.</p>
      </section>
      <SiteFooter />
    </main>
  );
}
