import type { Metadata } from "next";
import { SignInForm } from "@/components/SignInForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Secure passwordless sign-in for AgentSiraji customers and owners.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/account/commerce";
  return (
    <main>
      <SiteHeader />
      <section className="subhero shell">
        <span className="kicker">Secure account access</span>
        <h1>Sign in without a password.<br /><em>One link. One session.</em></h1>
        <p>Use the email attached to your AgentSiraji account. We will send a one-time link that expires after 15 minutes.</p>
      </section>
      <section className="products shell section">
        {params.error === "expired" ? <p className="form-message">That link is invalid, expired, or already used. Request a fresh link below.</p> : null}
        <SignInForm next={next} />
      </section>
      <SiteFooter />
    </main>
  );
}
