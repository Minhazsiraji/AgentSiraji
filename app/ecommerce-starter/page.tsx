import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StarterCheckout } from "@/components/StarterCheckout";
import { starterLiveEnabled } from "@/lib/starter-offer";
import s from "./starter.module.css";

export const metadata: Metadata = {
  title: "৳3,000 Setup Fee E-commerce Starter — Next.js, Checkout, Courier, Pixel & CAPI",
  description: "AgentSiraji E-commerce Starter: ৳3,000 setup fee for a modern customizable Next.js + Vercel store. First-month hosting + support ৳2,000 is due at start; domain is charged at actual cost.",
  alternates: { canonical: "/ecommerce-starter" },
  openGraph: { title: "মাত্র ৳৩,০০০ Setup Fee-তে E-commerce Business শুরু করুন | AgentSiraji",
    description: "Website + Selling System + Tracking + Automation. Transparent setup and recurring costs." },
};
const features = [
  ["◈", "Modern & Customizable Website", "Next.js + Vercel ভিত্তিক fast, mobile-friendly online store"],
  ["▤", "Product & Inventory", "Product details, catalog ও basic stock setup"],
  ["▣", "Cart + Checkout", "COD ও অর্ডার গ্রহণের streamlined flow"],
  ["↗", "Courier Integration", "Supported courier-এর সাথে connected order workflow"],
  ["◎", "Meta Pixel + CAPI", "Browser ও Server conversion signals-এর foundation"],
  ["⚙", "Order Management", "Order processing, basic technical setup ও launch support"],
];
const steps = ["Customer visits","Views product","Adds to cart","Checkout","Order confirmed","Courier"];
export default function EcommerceStarter() {
  return <main className={s.root}>
    <div className={s.landingBrand + " shell"}>
      <Image src="/agentsiraji-official-horizontal.webp" alt="AgentSiraji" width={300} height={95} priority />
    </div>
    <div className={s.backdrop}>
      <section className={s.hero + " shell"}>
        <div>
          <p className={s.eyebrow}><span className={s.dot} /> AGENTSIRAJI E-COMMERCE STARTER</p>
          <h1><span className={s.bnLine}>আপনার স্বপ্নের</span><span className={s.enLine}>Online Business</span><span className={s.bnLine}>শুরু করুন</span><em>মাত্র ৳৩,০০০ Setup Fee-তে</em></h1>
          <p className={s.subtitle}>শুধু Website নয় — একটি Modern, Customizable Connected Selling System। Next.js + Vercel Store + Checkout + Courier + Meta Pixel & CAPI + Order Management।</p>
          <div className={s.actions}>
            <a className={s.primary} href="#starter-order">START MY BUSINESS — ৳5,000 + Domain <span>↗</span></a>
            <a className={s.secondary} href="https://wa.me/8801404385101?text=Hi%20AgentSiraji%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20%E0%A7%B33%2C000%20E-commerce%20Starter%20Package%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4" target="_blank" rel="noopener noreferrer">Questions? WhatsApp Us ↗</a>
          </div>
          <p className={s.audience}>For students • Women entrepreneurs • New business owners • Facebook sellers</p>
        </div>
        <div className={s.display} aria-label="Illustration of integrated e-commerce sales system">
          <div className={s.displayTop}><span>AS / COMMERCE</span><span className={s.online}>● Online store</span></div>
          <div className={s.displayMetric}><small>CONNECTED SELLING SYSTEM</small><strong>One store.<br />Smarter workflow.</strong></div>
          <div className={s.displayOrders}><span>Product</span><i>→</i><span>Checkout</span><i>→</i><span>Order</span></div>
          <div className={s.displayWidgets}><div><span>PIXEL</span><strong>Browser</strong><small>Signals</small></div><div><span>CAPI</span><strong>Server</strong><small>Signals</small></div><div><span>COURIER</span><strong>Delivery</strong><small>Workflow</small></div></div>
          <div className={s.displayFooter}>AGENTSIRAJI <span>Website + Tracking + Automation</span></div>
        </div>
      </section>
    </div>
    <section className={s.section + " shell"} id="features">
      <div className={s.heading}><span className={s.kicker}>WHAT YOU GET</span><h2>আপনার Online Business শুরু করতে<br /><em>যা দরকার — সব এক smart setup-এ।</em></h2><p>একটি Standard Starter Setup — পরিষ্কার scope, প্রয়োজনীয় integration এবং বাস্তব launch support।</p></div>
      <div className={s.featureGrid}>{features.map(([icon,label,desc])=><div className={s.feature} key={label}><b>{icon}</b><h3>{label}</h3><p>{desc}</p></div>)}</div>
    </section>
    <section className={s.darkBand}>
      <div className={s.section + " shell"}><span className={s.kicker}>HOW THE SYSTEM WORKS</span><h2>শুধু Website নয় — <em>একটি Connected Selling System</em></h2>
      <div className={s.steps}>{steps.map((step,i)=><div key={step}><small>{String(i+1).padStart(2,"0")}</small><strong>{step}</strong></div>)}</div>
      </div>
    </section>
    <section className={s.section + " shell"}>
      <div className={s.tracking}><div><span className={s.kicker}>SMART TRACKING</span><h2>Meta Pixel + CAPI<br /><em>মানে আরও ভালো data foundation</em></h2><p>Customer-এর গুরুত্বপূর্ণ action — ViewContent, AddToCart, InitiateCheckout ও verified Purchase — যথাযথ consent ও configuration অনুযায়ী track করা যায়। Browser Pixel ও server-side CAPI মিলিয়ে Meta-তে আরও dependable conversion signals পাঠানো সম্ভব।</p><strong>Better Tracking → Better Data → Smarter Ads.</strong><p className={s.smallNote}>Tracking setup মানেই guaranteed sales নয়। আপনার actual website ও Meta configuration অনুযায়ী integration করা হবে।</p></div>
      <div className={s.signalBox}><div>CUSTOMER <span>→</span> WEBSITE</div><div className={s.signalLine}><span>Browser Pixel</span><span>Server CAPI</span></div><div className={s.metaBox}>META<br /><small>Measurement &amp; Optimization Signals</small></div></div></div>
    </section>
    <section className={s.section + " shell"} id="pricing">
      <div className={s.heading}><span className={s.kicker}>HONEST & TRANSPARENT</span><h2>কত খরচ? <em>আগেই জেনে নিন।</em></h2></div>
      <div className={s.pricing}>
        <div className={s.priceCard}><span>STARTER SETUP FEE / ONE TIME</span><strong>৳3,000</strong><p>Modern & customizable Next.js + Vercel store, Cart, Checkout, COD, Orders, basic inventory, supported courier, Meta Pixel+CAPI setup ও launch assistance।</p><div className={s.dueToday}><span>DUE TO START</span><strong>৳5,000 + Domain Cost</strong><small>৳3,000 setup + ৳2,000 first-month hosting/support. Domain is charged at actual cost before registration.</small></div><a href="#starter-order">START FOR ৳5,000 + DOMAIN →</a></div>
        <div className={s.priceDetails}><div><span>Domain</span><strong>Actual cost</strong><small>Customer pays actual domain registration/renewal</small></div><div><span>Hosting + Technical Support</span><strong>৳2,000 / month</strong><small>First month is payable upfront with setup; then ৳2,000/month from the next billing month</small></div><div><span>Extra Customization</span><strong>৳2,000 extra</strong><small>Only when requested outside the standard scope; agree before work</small></div><p>No hidden charges. <Link href="/terms">Terms</Link> · <Link href="/refunds">Refunds</Link> · <Link href="/privacy">Privacy</Link></p></div>
      </div>
    </section>
    <section className={s.checkoutBand} id="starter-order"><div className={s.section + " shell"}><span className={s.kicker}>READY TO START?</span><h2>আপনার Business-এর<br /><em>শুরুটা হোক আজ।</em></h2><StarterCheckout enabled={starterLiveEnabled()} /></div></section>
    <div className={s.floating}><a href="https://wa.me/8801404385101?text=Hi%20AgentSiraji%2C%20I%20want%20the%203000%20E-commerce%20Starter%20Package" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">WhatsApp ↗</a></div>
  </main>;
}
