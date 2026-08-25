import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { products } from "@/lib/catalog";

const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Spark = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" /></svg>;

const statusLabel = (status: (typeof products)[number]["status"]) => {
  if (status === "available") return "Available now";
  if (status === "labs") return "Private development";
  return "Coming soon";
};

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> Building practical software for real business progress</div>
          <h1>Software that moves<br /><em>business forward.</em></h1>
          <p>AgentSiraji builds focused commerce, conversion, and intelligence products for ambitious businesses—simple to adopt, serious underneath, and designed to grow with you.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/products/commerce">Explore Commerce <Arrow /></Link>
            <Link className="text-link" href="#products">See all products <span>↗</span></Link>
          </div>
          <div className="proof">
            <div><strong>Sell</strong><span>Commerce</span></div>
            <div><strong>Convert</strong><span>LeadPilot</span></div>
            <div><strong>Grow</strong><span>AdIntel</span></div>
          </div>
        </div>
        <div className="hero-visual" aria-label="AgentSiraji product ecosystem illustration">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="signal-card"><span>AGENTSIRAJI SYSTEM</span><strong>Sell. Convert. Grow.</strong><div className="signal-line"><i /><i /><i /><i /><i /><i /><i /></div></div>
          <div className="float-card card-lead"><span className="mini-icon">CO</span><div><small>SELL</small><strong>Commerce</strong></div><b>↗</b></div>
          <div className="float-card card-doctor"><span className="mini-icon doctor">LP</span><div><small>CONVERT</small><strong>LeadPilot</strong></div><b>↗</b></div>
          <div className="orbit"><span /><span /><span /></div>
        </div>
      </section>

      <section className="ticker" aria-label="Core product promise"><div><span>Managed commerce</span><b>✦</b><span>Lead conversion</span><b>✦</b><span>Advertising intelligence</span><b>✦</b><span>Built for growth</span><b>✦</b><span>Managed commerce</span><b>✦</b><span>Lead conversion</span></div></section>

      <section className="products shell section" id="products">
        <div className="section-heading">
          <div><span className="kicker">01 — Products</span><h2>One company.<br /><em>A growing product system.</em></h2></div>
          <p>Start with the product you need today. AgentSiraji is designed so future products can join the same consistent brand, account, billing, and support experience.</p>
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
          <div><span className="kicker">02 — The growth loop</span><h2>Sell. Convert.<br /><em>Grow smarter.</em></h2></div>
          <p>Our commercial products are designed to become more useful together without forcing customers into unnecessary complexity.</p>
        </div>
        <div className="service-list">
          <article><span>01</span><div className="service-icon">↗</div><h3>Sell with Commerce</h3><p>Launch a fast, professional online store on a managed commerce foundation.</p></article>
          <article><span>02</span><div className="service-icon">⌁</div><h3>Capture demand</h3><p>Bring leads and customer conversations from your selling channels into a clearer workflow.</p></article>
          <article><span>03</span><div className="service-icon">⚡</div><h3>Convert with LeadPilot</h3><p>Help teams reply, qualify intent, and move more conversations toward confirmed orders.</p></article>
          <article><span>04</span><div className="service-icon">✦</div><h3>Improve with AdIntel</h3><p>Learn from advertising patterns and use the insight to create stronger original campaigns.</p></article>
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
          <span className="kicker">AgentSiraji Commerce is first to market</span>
          <h2>Ready to sell<br /><em>professionally?</em></h2>
          <p>Explore the managed commerce platform, compare plans, or talk to us about the right starting point for your business.</p>
          <Link className="button button-primary button-large" href="/products/commerce">Explore AgentSiraji Commerce <Arrow /></Link>
        </div>
        <div className="contact-shape"><span>AS</span></div>
      </section>

      <SiteFooter />
    </main>
  );
}
