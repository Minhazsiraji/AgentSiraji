import type { Metadata } from "next";
import StoreAuditForm from "@/components/StoreAuditForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import styles from "./store-audit.module.css";

export const metadata: Metadata = {
  title: "Free Store Audit",
  description: "Request a free manual 10-point audit of your online store or Facebook commerce setup from AgentSiraji.",
};

const checks = [
  ["Performance", "Mobile speed, Lighthouse signals, LCP and layout stability."],
  ["Mobile-first UX", "How quickly a customer can browse, decide and buy on a phone."],
  ["Product discovery", "Search, categories, filters and whether customers can find products without messaging."],
  ["Checkout", "Steps, guest checkout, COD and payment options appropriate to your market."],
  ["SEO readiness", "Titles, metadata, sitemap, canonicals and structured product data."],
  ["Tracking", "Pixel, server-side tracking and analytics readiness."],
  ["Trust", "HTTPS, policies, contact information and business credibility signals."],
  ["Media", "Image quality, file weight and mobile delivery."],
  ["Conversion", "Cart, stock handling, order confidence and follow-up friction."],
  ["Future readiness", "Whether the store can support shopping feeds, automation and AI discovery."],
];

export default function StoreAuditPage() {
  return (
    <main>
      <SiteHeader />
      <section className={`${styles.hero} shell`}>
        <div className={styles.heroGrid}>
          <div>
            <span className="kicker">Free commerce audit</span>
            <h1>Does your store pass the <em>10-second test?</em></h1>
            <p>Send us your store or Facebook page. We’ll manually review the customer journey across 10 practical areas and show you where sales may be leaking before you spend more on ads.</p>
            <a className="button button-primary" href="#request-audit">Get my free audit →</a>
          </div>
          <aside className={styles.scoreCard} aria-label="Example audit score card">
            <div className={styles.scoreTop}><span>Example store score</span><div className={styles.score}>58<small>/100</small></div></div>
            <ul><li><span>Performance</span><b>62</b></li><li><span>Mobile UX</span><b>50</b></li><li><span>Discovery</span><b>40</b></li><li><span>SEO</span><b>70</b></li><li><span>Tracking</span><b>30</b></li></ul>
          </aside>
        </div>
      </section>

      <section className={`${styles.main} shell`}>
        <div className={styles.layout}>
          <div>
            <span className="kicker">What we check</span>
            <h2>Ten practical checks.<br /><em>No fake instant score.</em></h2>
            <div className={styles.checks}>
              {checks.map(([title, copy], index) => <article className={styles.check} key={title}><b>{String(index + 1).padStart(2, "0")} · {title}</b><span>{copy}</span></article>)}
            </div>
            <div className={styles.steps}>
              <article className={styles.step}><strong>1. Submit the store</strong><p>Share the business, country, store or page URL and a few qualification details.</p></article>
              <article className={styles.step}><strong>2. We review manually</strong><p>The first audits are human-reviewed so we can give useful observations instead of an unreliable automated grade.</p></article>
              <article className={styles.step}><strong>3. Get the next move</strong><p>You receive the audit findings and, where useful, a recommendation for improving the current store or moving to AgentSiraji Commerce.</p></article>
            </div>
            <p className={styles.disclaimer}>The audit is a practical commercial review, not a security penetration test, legal certification, SEO guarantee, or formal accessibility certification. Scores and observations depend on what is publicly accessible at review time.</p>
          </div>

          <aside className={styles.formCard} id="request-audit">
            <span className="kicker">Request your audit</span>
            <h2>Get your store score.</h2>
            <p>Free during the launch test. We aim to review qualified submissions within 24 hours.</p>
            <StoreAuditForm />
            <div className={styles.note}><strong>Best fit:</strong> Facebook / Instagram sellers, growing online stores, and brands that are already receiving orders but want a faster, more professional commerce setup.</div>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
