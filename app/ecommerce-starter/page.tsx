import type { Metadata } from "next";
import Link from "next/link";
import { StarterCheckout } from "@/components/StarterCheckout";
import { starterLiveEnabled } from "@/lib/starter-offer";
import s from "./starter.module.css";

export const metadata: Metadata = {
  title: "৳3,000 Setup Fee E-commerce Starter — Next.js, Checkout, Courier, Pixel & CAPI",
  description: "AgentSiraji E-commerce Starter: ৳3,000 one-time setup fee + ৳2,000 first-month hosting/support due at start. Modern customizable Next.js + Vercel store, checkout, courier workflow and Meta Pixel + CAPI.",
  alternates: { canonical: "/ecommerce-starter" },
  openGraph: {
    title: "মাত্র ৳৩,০০০ Setup Fee-তে E-commerce Business শুরু করুন | AgentSiraji",
    description: "Modern Store + Checkout + Courier + Pixel & CAPI. Start today with ৳5,000 + actual domain cost.",
  },
};

const features = [
  ["◈", "Modern & Customizable Website", "Next.js + Vercel ভিত্তিক fast, mobile-friendly online store"],
  ["▤", "Product & Inventory", "Product details, catalog ও basic stock setup"],
  ["▣", "Cart + Checkout", "COD ও অর্ডার গ্রহণের streamlined flow"],
  ["↗", "Courier Integration", "Supported courier-এর সাথে connected order workflow"],
  ["◎", "Meta Pixel + CAPI", "Browser ও Server conversion signals-এর foundation"],
  ["⚙", "Order Management", "Order processing, basic technical setup ও launch support"],
];

const steps = ["Customer visits", "Views product", "Adds to cart", "Checkout", "Order confirmed", "Courier"];

const waConsult =
  "https://wa.me/8801404385101?text=" +
  encodeURIComponent("Hi AgentSiraji, আমি E-commerce Starter package-এর live demo / 10-minute setup consultation চাই।");

export default function EcommerceStarter() {
  return <main className={s.root}>
    <div className={s.landingBrand + " shell"}>
      <img className={s.brandLogo} src="/agentsiraji-header-logo.webp" alt="AgentSiraji" width="360" height="65" decoding="async" />
    </div>

    <div className={s.backdrop}>
      <section className={s.hero + " shell"}>
        <div>
          <p className={s.eyebrow}><span className={s.dot} /> AGENTSIRAJI E-COMMERCE STARTER</p>
          <h1>
            <span className={s.bnLine}>আপনার Online Business</span>
            <span className={s.enLine}>Modern System দিয়ে</span>
            <span className={s.bnLine}>শুরু করুন</span>
            <em>Website + Setup Fee ৳৩,০০০</em>
          </h1>
          <p className={s.subtitle}>
            কোনো cheap template নয় — একটি Modern, Customizable <strong>Next.js + Vercel</strong> selling system:
            Store + Checkout + Courier + Order Management + Meta Pixel & CAPI।
          </p>

          <div className={s.heroPrice}>
            <span>আজ শুরু করতে</span>
            <strong>৳5,000 + Domain actual cost</strong>
            <small>৳3,000 one-time setup + ৳2,000 first-month hosting & technical support</small>
          </div>

          <div className={s.actions}>
            <a className={s.primary} href="#system-demo">SEE WHAT YOU GET <span>↓</span></a>
            <a className={s.secondary} href={waConsult} target="_blank" rel="noopener noreferrer">GET 10-MIN CONSULTATION ↗</a>
          </div>

          <p className={s.audience}>For Facebook Sellers • Boutique Owners • Home-based Brands • Small Businesses ready to sell online</p>
        </div>

        <div className={s.display} aria-label="Illustration of integrated e-commerce sales system">
          <div className={s.displayTop}><span>AS / COMMERCE</span><span className={s.online}>● Online store</span></div>
          <div className={s.displayMetric}><small>CONNECTED SELLING SYSTEM</small><strong>One store.<br />Smarter workflow.</strong></div>
          <div className={s.displayOrders}><span>Product</span><i>→</i><span>Checkout</span><i>→</i><span>Order</span></div>
          <div className={s.displayWidgets}>
            <div><span>PIXEL</span><strong>Browser</strong><small>Signals</small></div>
            <div><span>CAPI</span><strong>Server</strong><small>Signals</small></div>
            <div><span>COURIER</span><strong>Delivery</strong><small>Workflow</small></div>
          </div>
          <div className={s.displayFooter}>AGENTSIRAJI <span>Website + Tracking + Automation</span></div>
        </div>
      </section>

      <div className={s.trustStrip + " shell"}>
        <span>✓ Next.js + Vercel</span>
        <span>✓ Mobile-first Checkout</span>
        <span>✓ Courier Workflow</span>
        <span>✓ Meta Pixel + CAPI</span>
      </div>
    </div>

    <section className={s.section + " shell"} id="system-demo">
      <div className={s.heading}>
        <span className={s.kicker}>SEE WHAT YOU ARE GETTING</span>
        <h2>কম দামে template নয় — <em>বাস্তব selling workflow</em></h2>
        <p>আপনার customer কীভাবে visit থেকে order করবে, আর আপনি কীভাবে order, courier ও tracking manage করবেন—এই starter setup-এ সেই core systemটাই তৈরি করা হবে।</p>
      </div>

      <div className={s.proofGrid}>
        <article className={s.proofCard}>
          <span>01 · STOREFRONT</span>
          <h3>Professional Online Store</h3>
          <p>Fast, mobile-friendly product experience with a modern Next.js + Vercel foundation.</p>
          <ul><li>Product catalog</li><li>Mobile responsive UI</li><li>Customizable brand styling</li></ul>
        </article>
        <article className={s.proofCard}>
          <span>02 · ORDER FLOW</span>
          <h3>Checkout → Order → Courier</h3>
          <p>Customer নিজেরাই checkout complete করবে; confirmed orders supported courier workflow-এ নেওয়া যাবে।</p>
          <ul><li>COD-ready checkout</li><li>Order management</li><li>Courier integration</li></ul>
        </article>
        <article className={s.proofCard}>
          <span>03 · TRACKING</span>
          <h3>Meta Pixel + CAPI</h3>
          <p>Browser + server conversion signals দিয়ে ViewContent, InitiateCheckout এবং verified Purchase-এর tracking foundation তৈরি করা হবে।</p>
          <ul><li>Pixel browser signals</li><li>CAPI server signals</li><li>Better measurement foundation</li></ul>
        </article>
      </div>

      <div className={s.proofCta}>
        <div>
          <strong>Payment-এর আগে system বুঝতে চান?</strong>
          <span>WhatsApp-এ 10-minute setup consultation নিন। আপনার business-এর জন্য scope fit কিনা আগে clear করুন।</span>
        </div>
        <a className={s.primary} href={waConsult} target="_blank" rel="noopener noreferrer">GET 10-MIN CONSULTATION ↗</a>
      </div>
    </section>

    <section className={s.whyBand}>
      <div className={s.section + " shell"}>
        <div className={s.heading}>
          <span className={s.kicker}>WHY ONLY ৳3,000 SETUP?</span>
          <h2>কম setup fee মানে <em>cheap website নয়</em></h2>
          <p>এই offer নতুন ও ছোট business-এর জন্য একটি standardized starter scope। Repeatable setup process ব্যবহার করায় development cost কম রাখা যাচ্ছে, কিন্তু technology foundation modern রাখা হচ্ছে।</p>
        </div>
        <div className={s.whyGrid}>
          <div><strong>Standard Starter Scope</strong><p>Core store, checkout, order, courier ও tracking setup আগে থেকেই defined—তাই unnecessary custom development cost নেই।</p></div>
          <div><strong>Transparent Monthly Support</strong><p>Setup fee আলাদা, hosting + technical support ৳2,000/month আলাদা। প্রথম মাস শুরুতেই payable।</p></div>
          <div><strong>Customization is Separate</strong><p>Standard scope-এর বাইরে extra customization চাইলে আগে scope agree করে ৳2,000 extra charge হবে।</p></div>
        </div>
      </div>
    </section>

    <section className={s.section + " shell"} id="features">
      <div className={s.heading}>
        <span className={s.kicker}>WHAT YOU GET</span>
        <h2>Online Business শুরু করতে<br /><em>যা দরকার — সব এক smart setup-এ।</em></h2>
        <p>একটি Standard Starter Setup — পরিষ্কার scope, প্রয়োজনীয় integration এবং বাস্তব launch support।</p>
      </div>
      <div className={s.featureGrid}>
        {features.map(([icon,label,desc]) => <div className={s.feature} key={label}><b>{icon}</b><h3>{label}</h3><p>{desc}</p></div>)}
      </div>
    </section>

    <section className={s.darkBand}>
      <div className={s.section + " shell"}>
        <span className={s.kicker}>HOW THE SYSTEM WORKS</span>
        <h2>শুধু Website নয় — <em>একটি Connected Selling System</em></h2>
        <div className={s.steps}>{steps.map((step,i) => <div key={step}><small>{String(i+1).padStart(2,"0")}</small><strong>{step}</strong></div>)}</div>
      </div>
    </section>

    <section className={s.section + " shell"}>
      <div className={s.tracking}>
        <div>
          <span className={s.kicker}>SMART TRACKING</span>
          <h2>Meta Pixel + CAPI<br /><em>মানে আরও ভালো data foundation</em></h2>
          <p>Customer-এর গুরুত্বপূর্ণ action — ViewContent, AddToCart, InitiateCheckout ও verified Purchase — যথাযথ consent ও configuration অনুযায়ী track করা যায়। Browser Pixel ও server-side CAPI মিলিয়ে Meta-তে আরও dependable conversion signals পাঠানো সম্ভব।</p>
          <strong>Better Tracking → Better Data → Smarter Ads.</strong>
          <p className={s.smallNote}>Tracking setup মানেই guaranteed sales নয়। আপনার actual website ও Meta configuration অনুযায়ী integration করা হবে।</p>
        </div>
        <div className={s.signalBox}>
          <div>CUSTOMER <span>→</span> WEBSITE</div>
          <div className={s.signalLine}><span>Browser Pixel</span><span>Server CAPI</span></div>
          <div className={s.metaBox}>META<br /><small>Measurement & Optimization Signals</small></div>
        </div>
      </div>
    </section>

    <section className={s.section + " shell"} id="pricing">
      <div className={s.heading}>
        <span className={s.kicker}>HONEST & TRANSPARENT</span>
        <h2>কত খরচ? <em>আগেই জেনে নিন।</em></h2>
      </div>
      <div className={s.pricing}>
        <div className={s.priceCard}>
          <span>WEBSITE + SETUP FEE / ONE TIME</span>
          <strong>৳3,000</strong>
          <p>Modern & customizable Next.js + Vercel store, Cart, Checkout, COD, Orders, basic inventory, supported courier, Meta Pixel+CAPI setup ও launch assistance।</p>
          <div className={s.dueToday}>
            <span>DUE TO START</span>
            <strong>৳5,000 + Domain Cost</strong>
            <small>৳3,000 setup + ৳2,000 first-month hosting/support. Domain is charged at actual cost before registration.</small>
          </div>
          <a href="#starter-order">START FOR ৳5,000 + DOMAIN →</a>
        </div>
        <div className={s.priceDetails}>
          <div><span>Domain</span><strong>Actual cost</strong><small>Customer pays actual domain registration/renewal</small></div>
          <div><span>Hosting + Technical Support</span><strong>৳2,000 / month</strong><small>First month is payable upfront with setup; then ৳2,000/month from the next billing month</small></div>
          <div><span>Extra Customization</span><strong>৳2,000 extra</strong><small>Only when requested outside the standard scope; agree before work</small></div>
          <p>No hidden charges. <Link href="/terms">Terms</Link> · <Link href="/refunds">Refunds</Link> · <Link href="/privacy">Privacy</Link></p>
        </div>
      </div>
    </section>

    <section className={s.checkoutBand} id="starter-order">
      <div className={s.section + " shell"}>
        <span className={s.kicker}>READY TO START?</span>
        <h2>৩টি তথ্য দিন —<br /><em>তারপর payment step দেখুন।</em></h2>
        <StarterCheckout enabled={starterLiveEnabled()} />
      </div>
    </section>

    <div className={s.floating}>
      <a href={waConsult} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">WhatsApp ↗</a>
    </div>
  </main>;
}
