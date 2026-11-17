import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StarterOrdersAdmin } from "@/components/StarterOrdersAdmin";

export const metadata: Metadata = {
  title: "E-commerce Starter Orders | Owner Operations",
  robots: { index: false, follow: false, nocache: true },
};
export default function StarterOrdersAdminPage() {
  return <main><SiteHeader/><section className="shell section">
    <span className="kicker">AGENTSIRAJI · OWNER OPERATIONS</span>
    <h1>৳3,000 Starter Orders</h1>
    <p>Admin-only manual-payment review. Never approve solely from a customer-submitted Transaction ID. Independently verify the transfer in bKash/City Bank records before marking Paid.</p>
    <StarterOrdersAdmin/>
  </section><SiteFooter/></main>;
}
