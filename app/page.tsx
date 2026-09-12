import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { products } from "@/lib/catalog";

const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Spark = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" /></svg>;

const tickerItems = [
  "Managed commerce",
  "Free store audit",
  "Lead conversion",
  "Built for growth",
];

const statusLabel = (status: (typeof products)[number]["status"]) => {
  if (status === "available") return "Available now";
  if (status === "labs") return "Private development";
  return "Coming soon";
};

function TickerGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="ticker-group" aria-hidden={hidden || undefined}>
      {tickerItems.map((item) => (
        <span className="ticker-item" key={item}>
          <span>{item}</span><b aria-hidden="true">✦</b>
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> Building practical software for real business progress</div>
          <h1>Software that moves<br /><em>business forward.</em></h1>
          <p>Start with a free Store Audit. We identify practical gaps in your current selling setup, then help qualified businesses choose the right AgentSiraji Commerce starting point.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/store-audit">Get Free Store Audit <Arrow /></Link>
            <Link className="text-link" href="/products/commerce">Explore Commerce <span>↗</span></Link>
          </div>
          <div className="proof">
            <div><strong>Audit</strong><span>Find the gaps</span></div>
            <div><strong>Sell</strong><span>Commerce</span></div>
            <div><strong>Grow</strong><span>AgentSiraji</span></div>
          </div>
        </div>
        <div className="hero-visual" aria-label="AgentSiraji product ecosystem illustration">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="signal-card"><span>AGENTSIRAJI SYSTEM</span><strong>Audit. Sell. Grow.</strong><div className="signal-line"><i /><i /><i /><i /><i /><i /><i /></div></div>
          <div className="float-card card-lead"><span className="mini-icon">AU</span><div><small>START</small><strong>Free Audit</strong></div><b>↗</b></div>
          <div className="float-card card-doctor"><span className="mini-icon doctor">CO</span><div><small>SELL</small><strong>Commerce</strong></div><b>↗</b></div>
          <div className="orbit"><span /><span /><span /></div>
        </div>
      </section>

      <section className="ticker" aria-label="Core product promise">
        <div className="ticker-viewport" tabIndex={0} aria-label="Swipe or scroll to explore AgentSiraji product promises">
          <div className="ticker-track">
            <TickerGroup />
            <TickerGroup hidden />
          </div>
        </div>
      </section>

      <section className="products shell section" id="products">
        <div className="section-heading">
          <div><span className="kicker">01 — Products</span><h2>One company.<br /><em>A growing product system.</em></h2></div>
          <p>Start with the free Store Audit, then explore the product that fits your business. Commerce is available now; LeadPilot and AdIntel remain in development.</p>
        </div>
        <div className="product-grid">
          {products.map((product, index) => (
            <article className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`} key={product.slug}>
              <div className="card-top"><span className={`status ${product.status === "labs" ? "light" : ""}`}>{statusLabel(product.status)}</span><span className="card-num">0{index + 1}</span></div>
              <div className={`product-art ${index % 2 === 0 ? "lead-art" : "diary-art"}`}>
                <div className="product-monogram">{product.shortName.slice(0, 2).toUpperCase()}<span>{product.pillar}</span></div>
              </div>
              <div className="product-copy">
                <span className="product-label">{product.category}</span>
                <h3>{product.shortName}</h3>
                <p>{product.summary}</p>
                <Link className="button button-primary" style={{ fontSize: "15px" }} href={`/products/${product.slug}`}>{product.status === "available" ? "Explore Commerce" : product.status === "labs" ? "View Labs project" : `Discover ${product.shortName}`} <Arrow /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="services section" id="solutions"><div className="shell">
        <div className="section-heading light-heading">
          <div><span className="kicker">02 — The first-customer path</span><h2>Audit. Qualify.<br /><em>Build the right store.</em></h2></div>
          <p>For the current launch phase, we keep the journey human and practical before automated commercial payments are enabled.</p>
        </div>
        <div className="service-list">
          <article><span>01</span><div className="service-icon">↗</div><h3>Run the free audit</h3><p>See practical gaps across performance, mobile UX, checkout, SEO, tracking, trust and conversion.</p></article>
          <article><span>02</span><div className="service-icon">⌁</div><h3>Review with AgentSiraji</h3><p>Qualified businesses receive human review and a clear recommendation for the next move.</p></article>
          <article><span>03</span><div className="service-icon">⚡</div><h3>Choose the right plan</h3><p>Compare Starter, Growth and Pro after the business need is understood—not before.</p></article>
          <article><span>04</span><div className="service-icon">✦</div><h3>Launch with control</h3><p>Early local customers are onboarded manually while gateway payments remain sandbox-only.</p></article>
        </div>
      </div></section>

      <section className="about shell section" id="about">
        <div className="about-badge"><Spark /><span>Built to<br /><strong>move</strong></span></div>
        <div className="about-copy">
          <span className="kicker">03 — Why AgentSiraji</span>
          <h2>Small by choice.<br /><em>Serious by nature.</em></h2>
          <p className="large-copy">We favor focused products, direct accountability, and foundations that stay adaptable as technology changes. The goal is not more software—it is better business movement.</p>
          <div className="values">
            <div><strong>Clarity over complexity</strong><p>Products should be understandable before they are impressive.</p></div>
            <div><strong>Proof over hype</strong><p>We publish real product capability and verified results—not decorative claims.</p></div>
            <div><strong>Built for tomorrow</strong><p>Flexible architecture lets products, providers, and capabilities evolve without rebuilding the company.</p></div>
          </div>
        </div>
      </section>

      <section className="contact shell" id="contact">
        <div className="contact-inner">
          <span className="kicker">Start before you spend</span>
          <h2>See what your store<br /><em>actually needs.</em></h2>
          <p>Run the free Store Audit first. If there is a strong fit, we will follow up and recommend the right Commerce plan and next step.</p>
          <Link className="button button-primary button-large" href="/store-audit">Get Free Store Audit <Arrow /></Link>
        </div>
        <div className="contact-shape"><span>AS</span></div>
      </section>

      <SiteFooter />
    </main>
  );
}
