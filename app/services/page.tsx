import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Services", description: "Product strategy, web experiences, automation, AI, and growth systems from AgentSiraji." };
const offers = [
  ["01", "Product strategy", "Turn a promising idea into a clear product direction.", "Discovery, opportunity definition, scope, feature priorities, launch roadmap"],
  ["02", "Web experiences", "Fast, focused websites that turn attention into action.", "Strategy, UX, responsive development, SEO foundation, Vercel deployment"],
  ["03", "Automation & AI", "Replace repetitive work with reliable connected systems.", "Workflow audit, tool integration, AI assistants, lead routing, reporting"],
  ["04", "Growth systems", "Build a practical path from first interest to revenue.", "Lead capture, qualification, CRM workflow, conversion journeys, measurement"]
];
export default function ServicesPage() { return <main><SiteHeader /><section className="subhero shell"><span className="kicker">Services</span><h1>Small team energy.<br /><em>Serious execution.</em></h1><p>Focused engagements designed to create visible progress without layers, handoffs, or unnecessary process.</p></section><section className="offer-list shell">{offers.map(([num,title,copy,scope])=><article key={num}><span>{num}</span><div><h2>{title}</h2><p>{copy}</p></div><div><small>Typical scope</small><p>{scope}</p></div></article>)}</section><section className="process shell"><span className="kicker">A simple process</span><div><article><b>01</b><h3>Understand</h3><p>Clarify the problem, outcome, and constraints.</p></article><article><b>02</b><h3>Shape</h3><p>Define the leanest useful solution and plan.</p></article><article><b>03</b><h3>Build</h3><p>Work in visible, reviewable increments.</p></article><article><b>04</b><h3>Move</h3><p>Launch, learn, and decide the next best step.</p></article></div><Link className="button button-primary" href="/contact">Start a project →</Link></section><SiteFooter /></main> }
