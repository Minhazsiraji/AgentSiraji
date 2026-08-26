import Link from "next/link";

export function SiteHeader() {
  return (
    <nav className="nav shell" aria-label="Main navigation">
      <Link className="brand" href="/"><span className="brand-mark">AS</span><span>AgentSiraji</span></Link>
      <div className="nav-links">
        <Link href="/#products">Products</Link>
        <Link href="/#solutions">Solutions</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/about">Company</Link>
      </div>
      <Link className="button button-small button-dark" href="/products/commerce">Explore Commerce <span>→</span></Link>
      <details className="mobile-menu">
        <summary aria-label="Open menu"><span /><span /><span /></summary>
        <div>
          <Link href="/#products">Products</Link>
          <Link href="/#solutions">Solutions</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/products/commerce">Commerce</Link>
          <Link href="/products/leadpilot">LeadPilot</Link>
          <Link href="/products/adintel">AdIntel</Link>
          <Link href="/products/doctors-diary">AgentSiraji Labs</Link>
          <Link href="/about">Company</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refunds">Refunds</Link>
        </div>
      </details>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer shell">
      <Link className="brand" href="/"><span className="brand-mark">AS</span><span>AgentSiraji</span></Link>
      <p>Practical software for businesses that want to move.</p>
      <div>
        <Link href="/#products">Products</Link>
        <Link href="/products/commerce">Commerce</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/about">Company</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refunds">Refunds</Link>
      </div>
      <small>© {new Date().getFullYear()} AgentSiraji. Built to move.</small>
    </footer>
  );
}
