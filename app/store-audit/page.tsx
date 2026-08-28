import type { Metadata } from "next";
import StoreAuditForm from "@/components/StoreAuditForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import styles from "./store-audit.module.css";

export const metadata: Metadata = {
  title: "Free Store Audit V2",
  description: "Get an automated preliminary 10-point store score from AgentSiraji, followed by human review for qualified businesses.",
};

const checks = [
  ["Performance", "Initial public-page delivery signals; browser Core Web Vitals are verified separately."],
  ["Mobile-first UX", "Viewport, responsive image and mobile-layout signals visible in the page."],
  ["Product discovery", "Search, categories, filters and whether customers can find products without messaging."],
  ["Checkout", "Cart, purchase CTA, checkout and payment-method signals visible publicly."],
  ["SEO readiness", "Titles, metadata, canonicals, language, sharing tags and structured data."],
  ["Tracking", "Common analytics, tag-manager and advertising-pixel signals visible publicly."],
  ["Trust", "HTTPS, policies, contact information and business credibility signals."],
  ["Media", "Image lazy-loading, alt text and responsive-image signals."],
  ["Conversion", "Cart, stock, reviews, delivery, checkout and order-confidence signals."],
  ["Future readiness", "Structured product data, data layers, feeds, automation and AI-discovery signals."],
];

export default function StoreAuditPage() {
  return (
    <main>
      <SiteHeader />
      <section className={`${styles.hero} shell`}>
        <div className={styles.heroGrid}>
          <div>
            <span className="kicker">Free commerce audit · V2</span>
            <h1>Does your store pass the <em>10-second test?</em></h1>
            <p>Submit a public store URL and AgentSiraji will generate a real preliminary score across 10 practical areas. Qualified submissions still receive human verification before the audit is treated as final.</p>
            <a className="button button-primary" href="#request-audit">Scan my store →</a>
          </div>
          <aside className={styles.scoreCard} aria-label="Sample Store Audit V2 result">
            <div className={styles.scoreTop}><span>Sample audit result</span><div className={styles.score}>58<small>/100</small></div></div>
            <ul><li><span>Performance</span><b>62</b></li><li><span>Mobile UX</span><b>50</b></li><li><span>Discovery</span><b>40</b></li><li><span>SEO</span><b>70</b></li><li><span>Tracking</span><b>30</b></li></ul>
            <p style={{ margin: "14px 0 0", fontSize: 11, lineHeight: 1.5, color: "#7182a2" }}>Sample only. Your actual preliminary score is calculated after you submit a publicly accessible store URL.</p>
          </aside>
        </div>
      </section>

      <section className={`${styles.main} shell`}>
        <div className={styles.layout}>
          <div>
            <span className="kicker">What V2 checks</span>
            <h2>Ten practical checks.<br /><em>Automated first, human verified.</em></h2>
            <div className={styles.checks}>
              {checks.map(([title, copy], index) => <article className={styles.check} key={title}><b>{String(index + 1).padStart(2, "0")} · {title}</b><span>{copy}</span></article>)}
            </div>
            <div className={styles.steps}>
              <article className={styles.step}><strong>1. Submit the store</strong><p>Share the business, country, public store URL and qualification details.</p></article>
              <article className={styles.step}><strong>2. V2 scans automatically</strong><p>The scanner reads public signals, calculates the 10 category scores, and shows the preliminary result immediately when the page can be accessed.</p></article>
              <article className={styles.step}><strong>3. We verify the next move</strong><p>Human review confirms browser behavior, checkout, tracking and the commercial recommendations before a final audit is sent.</p></article>
            </div>
            <p className={styles.disclaimer}>Store Audit V2 is a preliminary public-page commercial audit, not a security penetration test, legal certification, SEO guarantee, or formal accessibility certification. Browser-only behavior, authenticated checkout and real Core Web Vitals require separate verification.</p>
          </div>

          <aside className={styles.formCard} id="request-audit">
            <span className="kicker">Run Store Audit V2</span>
            <h2>Get your preliminary score.</h2>
            <p>The automated scan usually takes a few seconds. Qualified submissions remain eligible for human review during the launch test.</p>
            <StoreAuditForm />
            <div className={styles.note}><strong>Best fit:</strong> Public e-commerce stores and social sellers with an accessible storefront URL. Facebook-only pages may require manual review if the platform blocks automated scanning.</div>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
