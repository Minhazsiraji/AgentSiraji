import type { Metadata } from "next";
import { SecureCommerceAccount } from "@/components/SecureCommerceAccount";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Commerce Account",
  description: "View your AgentSiraji Commerce account and activation status.",
  robots: { index: false, follow: false },
};

export default function CommerceAccountPage() {
  return (
    <main>
      <SiteHeader />
      <section className="subhero shell">
        <span className="kicker">Secure customer account</span>
        <h1>Your Commerce account.<br /><em>Owned by your sign-in.</em></h1>
        <p>
          Sign in with the email linked to your AgentSiraji organization. Payment references
          are no longer used as account credentials.
        </p>
      </section>
      <section className="products shell section">
        <SecureCommerceAccount />
      </section>
      <SiteFooter />
    </main>
  );
}
