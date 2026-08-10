import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Spark = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" /></svg>;

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> Building useful things, right now</div>
          <h1>Ideas into<br /><em>impact, fast.</em></h1>
          <p>AgentSiraji creates focused digital products and delivers high-speed services that help people work smarter, grow faster, and stay ahead.</p>
          <div className="hero-actions"><a className="button button-primary" href="#products">Explore our products <Arrow /></a><a className="text-link" href="/contact">Start a project <span>↗</span></a></div>
          <div className="proof"><div><strong>2</strong><span>Products in motion</span></div><div><strong>Fast</strong><span>Delivery by design</span></div><div><strong>1:1</strong><span>Founder-led service</span></div></div>
        </div>
        <div className="hero-visual" aria-label="AgentSiraji product ecosystem illustration">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="signal-card"><span>LIVE SIGNAL</span><strong>Building what&apos;s next.</strong><div className="signal-line"><i /><i /><i /><i /><i /><i /><i /></div></div>
          <div className="float-card card-lead"><span className="mini-icon">LP</span><div><small>SALES INTELLIGENCE</small><strong>LeadPilot</strong></div><b>↗</b></div>
          <div className="float-card card-doctor"><span className="mini-icon doctor">DD</span><div><small>HEALTHCARE</small><strong>Doctor&apos;s Diary</strong></div><b>↗</b></div>
          <div className="orbit"><span /><span /><span /></div>
        </div>
      </section>

      <section className="ticker" aria-label="Core capabilities"><div><span>Digital products</span><b>✦</b><span>Smart automation</span><b>✦</b><span>Rapid delivery</span><b>✦</b><span>Built for growth</span><b>✦</b><span>Digital products</span><b>✦</b><span>Smart automation</span></div></section>

      <section className="products shell section" id="products">
        <div className="section-heading"><div><span className="kicker">01 — Our products</span><h2>Built to solve.<br />Designed to <em>move.</em></h2></div><p>Focused products born from real problems—not feature lists. Each one is simple to use, fast to adopt, and engineered for measurable progress.</p></div>
        <div className="product-grid">
          <article className="product-card lead-card">
            <div className="card-top"><span className="status">In development</span><span className="card-num">01</span></div>
            <div className="product-art lead-art"><div className="lead-window"><div className="window-dots">● ● ●</div><div className="lead-row"><span /><i /></div><div className="lead-row"><span /><i /></div><div className="lead-row"><span /><i /></div><div className="lead-score">+42%<small>qualified leads</small></div></div></div>
            <div className="product-copy"><span className="product-label">Sales intelligence</span><h3>LeadPilot</h3><p>Turn scattered prospects into a clear, actionable pipeline. LeadPilot helps teams find, qualify, and move the right opportunities forward.</p><a href="/products/leadpilot">Discover LeadPilot <Arrow /></a></div>
          </article>
          <article className="product-card diary-card">
            <div className="card-top"><span className="status light">In development</span><span className="card-num">02</span></div>
            <div className="product-art diary-art"><div className="calendar"><div className="cal-top"><span>Doctor&apos;s Diary</span><b>+</b></div><div className="cal-days">M T W T F S S</div><div className="cal-grid">{Array.from({length: 21}, (_, i) => <i className={i === 10 ? "active" : ""} key={i}>{i + 1}</i>)}</div><div className="appointment"><span>10:30</span><strong>Patient follow-up</strong><b>✓</b></div></div></div>
            <div className="product-copy"><span className="product-label">Practice companion</span><h3>Doctor&apos;s Diary</h3><p>A calmer way for doctors to organize their professional day—appointments, patient follow-ups, and essential notes in one clear space.</p><a href="/products/doctors-diary">Discover Doctor&apos;s Diary <Arrow /></a></div>
          </article>
        </div>
      </section>

      <section className="services section" id="services"><div className="shell">
        <div className="section-heading light-heading"><div><span className="kicker">02 — Services</span><h2>Need it done?<br /><em>Consider it moving.</em></h2></div><p>Direct access, practical thinking, and rapid execution. No bloated process—just the right solution, built with care.</p></div>
        <div className="service-list">
          <article><span>01</span><div className="service-icon">✦</div><h3>Product strategy</h3><p>Shape the idea, define the opportunity, and turn ambiguity into a focused product roadmap.</p></article>
          <article><span>02</span><div className="service-icon">⌁</div><h3>Web experiences</h3><p>Fast, polished websites and product interfaces designed to earn attention and drive action.</p></article>
          <article><span>03</span><div className="service-icon">⚡</div><h3>Automation & AI</h3><p>Remove repetitive work and connect the right tools into lean, reliable business systems.</p></article>
          <article><span>04</span><div className="service-icon">↗</div><h3>Growth systems</h3><p>Practical lead generation and digital workflows built to turn interest into sustainable revenue.</p></article>
        </div>
      </div></section>

      <section className="about shell section" id="about">
        <div className="about-badge"><Spark /><span>Built by<br /><strong>Siraji</strong></span></div>
        <div className="about-copy"><span className="kicker">03 — Why AgentSiraji</span><h2>Small by choice.<br /><em>Serious by nature.</em></h2><p className="large-copy">You work directly with the builder—not through layers. That means clearer thinking, faster decisions, and work that stays close to the outcome you actually need.</p><div className="values"><div><strong>Speed with substance</strong><p>Move quickly without cutting the corners that matter.</p></div><div><strong>Clarity over complexity</strong><p>Simple solutions win adoption and create momentum.</p></div><div><strong>Built for tomorrow</strong><p>Flexible foundations that grow with your ambition.</p></div></div></div>
      </section>

      <section className="contact shell" id="contact"><div className="contact-inner"><span className="kicker">Have an idea or a problem?</span><h2>Let&apos;s make it<br /><em>move.</em></h2><p>Tell me what you&apos;re building—or what&apos;s slowing you down. You&apos;ll get a direct, thoughtful reply.</p><a className="button button-primary button-large" href="mailto:hello@agentsiraji.com?subject=Let's build something">hello@agentsiraji.com <Arrow /></a></div><div className="contact-shape"><span>AS</span></div></section>

      <SiteFooter />
    </main>
  );
}
