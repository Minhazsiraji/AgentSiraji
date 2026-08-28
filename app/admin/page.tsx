import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "AgentSiraji Admin",
  description: "Internal AgentSiraji commercial operations hub.",
  robots: { index: false, follow: false },
};

const tools = [
  {
    title: "Products & Pricing",
    description: "Manage regular prices, offer prices, annual prices, billing units, offer windows, usage limits and sales availability for current and future products.",
    href: "/admin/pricing",
    status: "Available with admin token",
  },
  {
    title: "Manual Payment Review",
    description: "Preview-only approval workflow for bank transfers and controlled manual invoice payments.",
    href: "/admin/payments",
    status: "Preview only",
  },
  {
    title: "Support Moderator Queue",
    description: "Preview-only mock moderator handoff queue for the future 24/7 support operation.",
    href: "/admin/support",
    status: "Preview only",
  },
] as const;

export default function AdminPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero lead-product shell">
        <div>
          <span className="status">Internal commercial control</span>
          <span className="kicker">AgentSiraji Admin</span>
          <h1>One control center.<br /><em>Every product can grow into it.</em></h1>
          <p>The admin hub keeps pricing, offers, payment review, and future operations separated from the public storefront while sharing one commercial foundation.</p>
        </div>
        <div className="product-monogram">AD<span>Admin</span></div>
      </section>

      <section className="products shell section">
        <div className="section-heading">
          <div><span className="kicker">Operations</span><h2>Choose the control.<br /><em>Keep sensitive actions gated.</em></h2></div>
          <p>The hub itself contains no secrets. Sensitive API actions still require their own server-side authorization boundary.</p>
        </div>
        <div className="product-grid">
          {tools.map((tool, index) => (
            <article className={`product-card ${index % 2 === 0 ? "lead-card" : "diary-card"}`} key={tool.href}>
              <div className="card-top"><span className="status">{tool.status}</span><span className="card-num">0{index + 1}</span></div>
              <div className="product-copy">
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <Link className="button button-primary" href={tool.href}>Open {tool.title} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
