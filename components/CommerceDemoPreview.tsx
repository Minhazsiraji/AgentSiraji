"use client";

import { useMemo, useState } from "react";
import type { OutreachDemo } from "@/lib/outreach-demo-db";
import styles from "@/app/demo/[slug]/demo.module.css";

type Checkout = {
  name: string;
  phone: string;
  location: string;
  payment: string;
};

function money(demo: OutreachDemo, value: number) {
  const amount = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  return `${demo.currencySymbol}${demo.currencySymbol.length > 2 ? " " : ""}${amount}`;
}

function templateLabel(template: OutreachDemo["template"]) {
  if (template === "AGRI") return "Locally made · trusted supply";
  if (template === "FOOD") return "Fresh products · simple ordering";
  if (template === "FASHION") return "New arrivals · easy checkout";
  if (template === "ELECTRONICS") return "Useful tech · clear prices";
  if (template === "HOME") return "Everyday essentials · delivered";
  return "Browse · order · stay connected";
}

export function CommerceDemoPreview({ demo }: { demo: OutreachDemo }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [checkout, setCheckout] = useState<Checkout>({ name: "", phone: "", location: "", payment: "Mobile money / transfer" });

  const items = useMemo(
    () => demo.products.map((product) => ({ ...product, qty: cart[product.id] ?? 0 })).filter((product) => product.qty > 0),
    [cart, demo.products],
  );
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const orderRef = useMemo(() => `${demo.businessName.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "ORD"}-${demo.slug.slice(-5).toUpperCase()}`, [demo.businessName, demo.slug]);

  function add(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    setCartOpen(true);
  }

  function change(id: string, delta: number) {
    setCart((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + delta) }));
  }

  function placeOrder() {
    if (!checkout.name.trim() || !checkout.phone.trim() || !checkout.location.trim() || count < 1) return;
    setCheckoutOpen(false);
    setConfirmed(true);
  }

  return (
    <main className={styles.page} data-template={demo.template.toLowerCase()}>
      <div className={styles.previewBar}>Private concept preview prepared for {demo.businessName}</div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <div className={styles.mark}>{demo.businessName.slice(0, 2).toUpperCase()}</div>
            <div><strong>{demo.businessName}</strong><span>{demo.city ? `${demo.city}, ` : ""}{demo.country}</span></div>
          </div>
          <nav className={styles.nav}><a href="#products">Products</a><a href="#how">How it works</a></nav>
          <button className={styles.cartButton} type="button" onClick={() => setCartOpen(true)}>Cart · {count}</button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>{templateLabel(demo.template)}</span>
            <h1>{demo.tagline}</h1>
            <p>Customers can browse what is available, see prices clearly and place an order directly — while your existing WhatsApp or social relationship can stay part of the customer experience.</p>
            <div className={styles.heroActions}>
              <a className={styles.primary} href="#products">Browse products</a>
              {demo.contactUrl && <a className={styles.secondary} href={demo.contactUrl} target="_blank" rel="noreferrer">{demo.contactLabel} ↗</a>}
            </div>
          </div>
          <div className={styles.heroVisual} style={demo.heroImageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(9,26,19,.18), rgba(9,26,19,.72)), url(${demo.heroImageUrl})` } : undefined}>
            {!demo.heroImageUrl && <><span>ONLINE STORE CONCEPT</span><strong>{demo.businessName}</strong><p>Own the direct buying journey without giving up the channels customers already use.</p></>}
          </div>
        </div>
      </section>

      <section id="products" className={styles.productsSection}>
        <div className={styles.sectionHead}><div><span>Sample catalogue</span><h2>Shop {demo.businessName}</h2></div><p>This personalized concept uses the business information supplied for the demo. Final products, branding, delivery and payment rules are configured during setup.</p></div>
        <div className={styles.productGrid}>
          {demo.products.map((product) => (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productImage}>
                {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <div className={styles.placeholder}>{product.name.slice(0, 1).toUpperCase()}</div>}
              </div>
              <div className={styles.productBody}>
                <div className={styles.productTop}><div><h3>{product.name}</h3>{product.size && <span>{product.size}</span>}</div><strong>{money(demo, product.price)}</strong></div>
                {product.description && <p>{product.description}</p>}
                <button type="button" onClick={() => add(product.id)}>Add to cart</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className={styles.howSection}>
        <div><span>01</span><strong>Browse</strong><p>Products, prices and details are visible before the customer starts a chat.</p></div>
        <div><span>02</span><strong>Order</strong><p>The website captures products, quantities and customer delivery details in a structured flow.</p></div>
        <div><span>03</span><strong>Continue the relationship</strong><p>WhatsApp, Instagram or your existing channels can remain available for support and repeat business.</p></div>
      </section>

      <footer className={styles.footer}>Concept powered by AgentSiraji Commerce</footer>

      {cartOpen && (
        <div className={styles.overlay} onMouseDown={(event) => { if (event.currentTarget === event.target) setCartOpen(false); }}>
          <aside className={styles.cartPanel}>
            <div className={styles.panelHead}><div><span>Your cart</span><h2>{count} item{count === 1 ? "" : "s"}</h2></div><button type="button" onClick={() => setCartOpen(false)}>×</button></div>
            <div className={styles.cartItems}>
              {items.length === 0 ? <p className={styles.empty}>Your cart is empty. Add a product to try the demo flow.</p> : items.map((item) => (
                <div className={styles.cartItem} key={item.id}>
                  <div><strong>{item.name}</strong><span>{item.size || "Product"}</span></div>
                  <b>{money(demo, item.price * item.qty)}</b>
                  <div className={styles.qty}><button type="button" onClick={() => change(item.id, -1)}>−</button><span>{item.qty}</span><button type="button" onClick={() => change(item.id, 1)}>+</button></div>
                </div>
              ))}
            </div>
            <div className={styles.cartFoot}><div><span>Total</span><strong>{money(demo, total)}</strong></div><button type="button" disabled={!count} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continue to checkout</button></div>
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.panelHead}><div><span>Checkout</span><h2>Delivery details</h2></div><button type="button" onClick={() => setCheckoutOpen(false)}>×</button></div>
            <p className={styles.note}>Demo only — no live payment is processed.</p>
            <div className={styles.fields}>
              <label>Full name<input value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} placeholder="Customer name" /></label>
              <label>Phone<input value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} placeholder="Phone / WhatsApp" /></label>
              <label>Delivery location<input value={checkout.location} onChange={(e) => setCheckout({ ...checkout, location: e.target.value })} placeholder="Town / delivery area" /></label>
              <label>Preferred payment<select value={checkout.payment} onChange={(e) => setCheckout({ ...checkout, payment: e.target.value })}><option>Mobile money / transfer</option><option>Cash on delivery</option><option>Card / online payment</option></select></label>
            </div>
            <div className={styles.orderTotal}><span>{count} item{count === 1 ? "" : "s"}</span><strong>{money(demo, total)}</strong></div>
            <button className={styles.placeOrder} type="button" disabled={!checkout.name.trim() || !checkout.phone.trim() || !checkout.location.trim()} onClick={placeOrder}>Place demo order →</button>
            <button className={styles.back} type="button" onClick={() => { setCheckoutOpen(false); setCartOpen(true); }}>Back to cart</button>
          </div>
        </div>
      )}

      {confirmed && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmation}>
            <span className={styles.check}>✓</span>
            <span className={styles.eyebrow}>Order received</span>
            <h2>Thanks, {checkout.name}.</h2>
            <p>Your sample order <strong>{orderRef}</strong> has been captured. In the real store, the business receives the order in its admin workflow and can confirm delivery/payment according to its setup.</p>
            <div className={styles.orderTotal}><span>Order total</span><strong>{money(demo, total)}</strong></div>
            {demo.contactUrl && <a className={styles.primary} href={demo.contactUrl} target="_blank" rel="noreferrer">Continue with {demo.businessName} ↗</a>}
            <button className={styles.back} type="button" onClick={() => setConfirmed(false)}>Continue browsing</button>
          </div>
        </div>
      )}
    </main>
  );
}
