import Link from "next/link";

export function SiteHeader() {
  return (
    <nav className="nav shell" aria-label="Main navigation">
      <Link className="brand" href="/"><span className="brand-mark">AS</span><span>AgentSiraji</span></Link>
      <div className="nav-links"><Link href="/#products">Products</Link><Link href="/services">Services</Link><Link href="/#about">About</Link></div>
      <Link className="button button-small button-dark" href="/contact">Let&apos;s talk <span>→</span></Link>
      <details className="mobile-menu"><summary aria-label="Open menu"><span /><span /><span /></summary><div><Link href="/#products">Products</Link><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link></div></details>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer shell">
      <Link className="brand" href="/"><span className="brand-mark">AS</span><span>AgentSiraji</span></Link>
      <p>Digital products &amp; rapid execution.</p>
      <div><Link href="/#products">Products</Link><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      <small>© {new Date().getFullYear()} AgentSiraji. Built to move.</small>
    </footer>
  );
}
