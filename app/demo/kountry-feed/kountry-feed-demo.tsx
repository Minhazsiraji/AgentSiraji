"use client";

import { useMemo, useState } from "react";
import styles from "./kountry-feed.module.css";

type Product = {
  id: string;
  name: string;
  type: string;
  size: string;
  price: number;
  stock: string;
  icon: string;
  description: string;
};

const products: Product[] = [
  {
    id: "layer-mash",
    name: "Layer Mash",
    type: "Poultry · Layers",
    size: "25 kg bag",
    price: 18500,
    stock: "In stock",
    icon: "🥚",
    description: "High-calcium organic feed for consistent laying and stronger shells.",
  },
  {
    id: "broiler-starter",
    name: "Broiler Starter",
    type: "Poultry · Broilers",
    size: "25 kg bag",
    price: 19200,
    stock: "In stock",
    icon: "🐔",
    description: "High-protein blend for healthy growth and efficient feed conversion.",
  },
  {
    id: "dairy-meal",
    name: "Dairy Meal",
    type: "Cattle",
    size: "50 kg bag",
    price: 32000,
    stock: "Low stock",
    icon: "🐄",
    description: "Energy-dense concentrate with balanced minerals for productive dairy cows.",
  },
  {
    id: "pig-grower",
    name: "Pig Grower",
    type: "Swine",
    size: "25 kg bag",
    price: 17800,
    stock: "In stock",
    icon: "🐖",
    description: "Locally sourced grower feed formulated for lean, efficient weight gain.",
  },
];

const provinces = ["Eastern Province", "Kigali City", "Northern Province", "Southern Province", "Western Province"];

function money(value: number) {
  return `RWF ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

export function KountryFeedDemo() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [province, setProvince] = useState("Eastern Province");
  const [payment, setPayment] = useState("MTN Mobile Money");

  const items = useMemo(
    () => products.map((product) => ({ ...product, qty: cart[product.id] ?? 0 })).filter((item) => item.qty > 0),
    [cart],
  );
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  function add(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    setCartOpen(true);
  }

  function change(id: string, delta: number) {
    setCart((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + delta) }));
  }

  const orderText = encodeURIComponent(
    `Hello Kountry Feed, I would like to place this order:\n${items
      .map((item) => `• ${item.name} (${item.size}) × ${item.qty} — ${money(item.price * item.qty)}`)
      .join("\n")}\n\nSubtotal: ${money(subtotal)}\nDelivery: ${province}\nPreferred payment: ${payment}`,
  );
  const whatsappHref = `https://wa.me/250787391260?text=${orderText}`;

  return (
    <main className={styles.page}>
      <div className={styles.demoBar}>Personalized AgentSiraji Commerce concept · Demo only · No payment is processed</div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <div className={styles.logo}>KF</div>
            <div>
              <strong>Kountry Feed</strong>
              <span>Organic animal feed · Rwanda</span>
            </div>
          </div>
          <nav className={styles.nav}>
            <a href="#products">Products</a>
            <a href="#why">Why this flow</a>
            <a href="#delivery">Delivery</a>
          </nav>
          <button className={styles.cartButton} onClick={() => setCartOpen(true)}>Cart · {count}</button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.pill}>🇷🇼 100% Organic · Made in Rwanda</div>
            <h1>Better feed.<br />Easier ordering.</h1>
            <p>Let customers browse feed types, bag sizes and prices, build an order, then continue the final conversation on WhatsApp.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryCta} href="#products">Browse feed products</a>
              <a className={styles.secondaryCta} href="https://wa.me/250787391260" target="_blank" rel="noreferrer">WhatsApp sales ↗</a>
            </div>
            <div className={styles.stats}>
              <div><strong>5</strong><span>Feed types</span></div>
              <div><strong>5</strong><span>Provinces</span></div>
              <div><strong>100%</strong><span>Organic inputs</span></div>
              <div><strong>1–3 days</strong><span>Typical delivery</span></div>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Kountry Feed brand concept">
            <div className={styles.visualLabel}>Farm to bag · every batch</div>
            <h2>Organic nutrition rooted in Rwanda.</h2>
            <div className={styles.visualGrid}>
              <div className={styles.visualCard}><span>🌽</span><strong>Local sourcing</strong><p>Maize, soya and sunflower from Rwandan farmers.</p></div>
              <div className={styles.visualCard}><span>🌱</span><strong>Organic positioning</strong><p>No synthetic additives in the brand story.</p></div>
              <div className={styles.visualCard}><span>📦</span><strong>Clear products</strong><p>Feed, bag size, price and stock before the chat starts.</p></div>
              <div className={styles.visualCard}><span>💬</span><strong>WhatsApp stays</strong><p>Structured order first, conversation second.</p></div>
            </div>
            <div className={styles.locationStrip}><span>Production</span><strong>Rwamagana · Eastern Province</strong></div>
          </div>
        </div>
      </section>

      <section id="products" className={styles.productsSection}>
        <div className={styles.sectionHead}>
          <div><span>Current published pricing</span><h2>Organic feed products</h2></div>
          <p>Real Kountry Feed product names and published prices are used here; the pack artwork below is a demo concept, not an official product photograph.</p>
        </div>
        <div className={styles.productGrid}>
          {products.map((product) => (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productVisual}>
                <div className={styles.stock}>{product.stock}</div>
                <div className={styles.feedBag}>
                  <span className={styles.bagIcon}>{product.icon}</span>
                  <small>KOUNTRY FEED</small>
                  <strong>{product.name}</strong>
                  <em>100% Organic</em>
                  <b>{product.size}</b>
                </div>
              </div>
              <div className={styles.productBody}>
                <div className={styles.productTitleRow}>
                  <div><h3>{product.name}</h3><span>{product.type} · {product.size}</span></div>
                  <strong>{money(product.price)}</strong>
                </div>
                <p>{product.description}</p>
                <button onClick={() => add(product.id)}>Add to order</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="why" className={styles.whySection}>
        <div className={styles.whyInner}>
          <div><span>01</span><h3>Browse before messaging</h3><p>Customers see the product, size, price and stock signal before asking repetitive questions.</p></div>
          <div><span>02</span><h3>Build a structured cart</h3><p>They select quantities themselves instead of typing product names and bag counts manually.</p></div>
          <div><span>03</span><h3>Keep WhatsApp</h3><p>The prepared order moves into WhatsApp with products, quantities, province and payment preference already written.</p></div>
        </div>
      </section>

      <section id="delivery" className={styles.deliverySection}>
        <div className={styles.deliveryCard}>
          <div><span>Nationwide delivery</span><h2>From Rwamagana to farms across Rwanda.</h2><p>Eastern Province can often receive same or next-day delivery. Other provinces are typically served within 1–3 business days, with final delivery cost confirmed by Kountry Feed.</p></div>
          <div className={styles.provinceGrid}>{provinces.map((item) => <div key={item}>✓ {item}</div>)}</div>
        </div>
      </section>

      <footer className={styles.footer}>Personalized concept for Kountry Feed · Built with AgentSiraji Commerce</footer>

      {cartOpen && (
        <div className={styles.overlay} onMouseDown={(event) => { if (event.currentTarget === event.target) setCartOpen(false); }}>
          <aside className={styles.cartPanel}>
            <div className={styles.panelHead}><div><span>Your order</span><h2>Cart · {count} bags</h2></div><button onClick={() => setCartOpen(false)}>×</button></div>
            <div className={styles.cartItems}>
              {items.length === 0 ? <div className={styles.emptyCart}>Your cart is empty. Add a feed product to build a sample order.</div> : items.map((item) => (
                <div className={styles.cartItem} key={item.id}>
                  <div className={styles.cartIcon}>{item.icon}</div>
                  <div className={styles.cartInfo}>
                    <div><strong>{item.name}</strong><span>{item.size}</span></div>
                    <b>{money(item.price * item.qty)}</b>
                    <div className={styles.qty}><button onClick={() => change(item.id, -1)}>−</button><span>{item.qty}</span><button onClick={() => change(item.id, 1)}>+</button></div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.cartFoot}><div><span>Product subtotal</span><strong>{money(subtotal)}</strong></div><button disabled={!items.length} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continue to order details</button></div>
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.checkoutModal}>
            <div className={styles.panelHead}><div><span>Structured WhatsApp order</span><h2>Finish the details</h2></div><button onClick={() => setCheckoutOpen(false)}>×</button></div>
            <p className={styles.modalIntro}>This demo does not take payment. It prepares a complete order for the Kountry Feed sales team.</p>
            <div className={styles.fields}>
              <label>Delivery province<select value={province} onChange={(event) => setProvince(event.target.value)}>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Preferred payment<select value={payment} onChange={(event) => setPayment(event.target.value)}><option>MTN Mobile Money</option><option>Airtel Money</option><option>Bank transfer</option><option>Cash on delivery</option></select></label>
            </div>
            <div className={styles.orderSummary}><span>{count} bag(s)</span><strong>{money(subtotal)}</strong></div>
            <a className={styles.whatsappButton} href={whatsappHref} target="_blank" rel="noreferrer">Send complete order to WhatsApp ↗</a>
            <button className={styles.backButton} onClick={() => { setCheckoutOpen(false); setCartOpen(true); }}>Back to cart</button>
          </div>
        </div>
      )}
    </main>
  );
}
