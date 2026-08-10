import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Start a project", description: "Contact AgentSiraji about a digital product, website, automation, or growth system." };

export default function ContactPage() {
  return <main><SiteHeader /><section className="subhero shell"><span className="kicker">Start a conversation</span><h1>Bring the problem.<br /><em>We&apos;ll find the move.</em></h1><p>Share a little context and you&apos;ll get a direct, practical reply—usually within one business day.</p></section><section className="contact-layout shell"><div><h2>Tell me what you&apos;re working on.</h2><ContactForm /></div><aside><span className="kicker">Direct contact</span><a href="mailto:hello@agentsiraji.com">hello@agentsiraji.com</a><div className="contact-note"><strong>Good briefs include</strong><p>The goal, current challenge, desired timeline, and any useful links. An early idea is perfectly fine.</p></div><div className="availability"><span className="pulse" /> Accepting selected projects</div></aside></section><SiteFooter /></main>;
}
