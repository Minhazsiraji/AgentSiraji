import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommerceAccountStatus } from "@/components/CommerceAccountStatus";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Commerce Account",
  description: "View your AgentSiraji Commerce purchase and activation status.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ provider?: string; transactionId?: string }>;
};

export default async function CommerceAccountPage({ searchParams }: Props) {
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.COMMERCIAL_ACCOUNT_PREVIEW_ENABLED !== "true"
  ) {
    notFound();
  }

  const params = await searchParams;
  const provider = params.provider === "sslcommerz" ? "sslcommerz" : "paddle";
  const transactionId = params.transactionId?.trim() ?? "";

  return (
    <main>
      <SiteHeader />
      <section className="subhero shell">
        <span className="kicker">Customer account preview</span>
        <h1>Your Commerce purchase.<br /><em>Status in one place.</em></h1>
        <p>
          This sandbox account view shows the package you purchased and the verified
          payment, subscription, and access state. Full customer sign-in will wrap
          this view before production launch.
        </p>
      </section>

      <section className="products shell section">
        {transactionId ? (
          <CommerceAccountStatus provider={provider} transactionId={transactionId} />
        ) : (
          <article className="product-card lead-card">
            <div className="product-copy">
              <span className="product-label">Account status</span>
              <h3>No transaction selected.</h3>
              <p>Complete a Commerce checkout to open the related purchase status.</p>
              <Link className="button button-primary" href="/checkout/commerce">Return to checkout →</Link>
            </div>
          </article>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
