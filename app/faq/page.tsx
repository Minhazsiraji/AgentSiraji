import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
export const metadata: Metadata = { title: "Frequently asked questions", description: "Answers about AgentSiraji services, products, process, timelines, and support." };
const faqs=[
  ["What can AgentSiraji build?","Focused websites, product interfaces, workflow automations, AI-enabled tools, lead-generation systems, and early-stage digital products."],
  ["Do you work with early ideas?","Yes. An engagement can begin with an unclear idea or business problem. Product strategy helps turn it into a practical scope and roadmap."],
  ["How long does a project take?","A focused website or automation can often move from definition to launch within a few weeks. Larger product work is divided into clear milestones after discovery."],
  ["Are LeadPilot and Doctor's Diary available now?","Both products are currently in development. You can register interest through the contact page and receive launch updates."],
  ["Can the website or system grow later?","Yes. Solutions are built on flexible foundations so new workflows, integrations, authentication, payments, or content can be added when justified."],
  ["How do support and changes work?","Every project includes a defined handover. Ongoing improvement and support can be arranged according to the product and business need."],
  ["Do you work outside Bangladesh?","Yes. AgentSiraji is based in Dhaka and can work remotely with businesses and founders internationally."],
  ["How do we start?","Send a short inquiry with your goal, challenge, and preferred timeline. You will receive a direct response with the most sensible next step."]
];
export default function FaqPage(){return <main><SiteHeader/><section className="subhero shell"><span className="kicker">FAQ</span><h1>Useful answers.<br/><em>No sales theatre.</em></h1><p>A quick guide to products, services, process, and working together.</p></section><section className="faq-list shell">{faqs.map(([q,a],i)=><details key={q}><summary><span>{String(i+1).padStart(2,"0")}</span><h2>{q}</h2><b>+</b></summary><p>{a}</p></details>)}</section><section className="mini-cta shell"><div><span className="kicker">Still curious?</span><h2>Ask directly.</h2></div><Link className="button button-primary" href="/contact">Start a conversation →</Link></section><SiteFooter/></main>}
