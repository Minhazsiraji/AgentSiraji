"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type DemoLead = {
  id: string;
  businessName: string;
  country: string;
  city: string | null;
  category: string | null;
  profileUrl: string | null;
  replyStatus: string;
  status: string;
};

type ProductRow = {
  id: string;
  name: string;
  price: string;
  size: string;
  description: string;
  imageUrl: string;
};

type DemoForm = {
  businessName: string;
  country: string;
  city: string;
  template: "STANDARD" | "FOOD" | "FASHION" | "AGRI" | "ELECTRONICS" | "HOME";
  tagline: string;
  currencyCode: string;
  currencySymbol: string;
  contactUrl: string;
  contactLabel: string;
  heroImageUrl: string;
  logoImageUrl: string;
  brandColor: string;
  products: ProductRow[];
};

type SavedDemo = Omit<DemoForm, "products"> & {
  slug: string;
  updatedAt?: string;
  products: Array<Omit<ProductRow, "price"> & { price: string | number }>;
};

type DemoPayload = { ok?: boolean; error?: string; demo?: SavedDemo | null; demoUrl?: string };

const modalStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "rgba(8, 18, 31, .58)",
  backdropFilter: "blur(8px)",
  display: "grid",
  placeItems: "center",
  padding: "1rem",
} as const;

const panelStyle = {
  width: "min(1040px, 96vw)",
  maxHeight: "92vh",
  overflow: "auto",
  borderRadius: "1.6rem",
  background: "#f7f9ff",
  border: "1px solid rgba(20, 47, 91, .12)",
  boxShadow: "0 30px 100px rgba(7, 23, 52, .34)",
  padding: "0 1.25rem 1.25rem",
  isolation: "isolate",
} as const;

const stickyHeaderStyle = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  margin: "0 -1.25rem",
  padding: "1rem 1.25rem",
  background: "rgba(247, 249, 255, .96)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid rgba(20, 47, 91, .1)",
} as const;

const closeStyle = {
  minWidth: "92px",
  fontWeight: 900,
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: ".75rem",
} as const;

const rowStyle = { display: "flex", gap: ".55rem", flexWrap: "wrap", alignItems: "center" } as const;

function currencyFor(country: string) {
  const key = country.trim().toLowerCase();
  if (key.includes("nepal")) return { code: "NPR", symbol: "Rs" };
  if (key.includes("ghana")) return { code: "GHS", symbol: "GH₵" };
  if (key.includes("rwanda")) return { code: "RWF", symbol: "RWF" };
  if (key.includes("kenya")) return { code: "KES", symbol: "KSh" };
  if (key.includes("nigeria")) return { code: "NGN", symbol: "₦" };
  if (key.includes("bangladesh")) return { code: "BDT", symbol: "৳" };
  return { code: "USD", symbol: "$" };
}

function templateFor(category: string | null): DemoForm["template"] {
  const value = (category || "").toLowerCase();
  if (/feed|farm|agri|livestock|poultry/.test(value)) return "AGRI";
  if (/food|organic|drink|beverage|bakery|grocery|wellness/.test(value)) return "FOOD";
  if (/fashion|cloth|apparel|jewel|cosmetic|beauty|accessor/.test(value)) return "FASHION";
  if (/electronic|phone|computer|gadget|tech/.test(value)) return "ELECTRONICS";
  if (/home|kitchen|furniture|decor|household/.test(value)) return "HOME";
  return "STANDARD";
}

function defaultBrandColor(template: DemoForm["template"]) {
  if (template === "AGRI") return "#205a3b";
  if (template === "FOOD") return "#7a3f24";
  if (template === "FASHION") return "#5a3158";
  if (template === "ELECTRONICS") return "#253c70";
  if (template === "HOME") return "#735b3f";
  return "#245c45";
}

function blankProduct(index: number): ProductRow {
  return { id: `product-${index + 1}`, name: "", price: "", size: "", description: "", imageUrl: "" };
}

function initialForm(lead: DemoLead): DemoForm {
  const currency = currencyFor(lead.country);
  const template = templateFor(lead.category);
  return {
    businessName: lead.businessName,
    country: lead.country,
    city: lead.city || "",
    template,
    tagline: `A simpler way to buy from ${lead.businessName}.`,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    contactUrl: lead.profileUrl || "",
    contactLabel: lead.profileUrl?.includes("wa.me") ? "WhatsApp us" : "Contact us",
    heroImageUrl: "",
    logoImageUrl: "",
    brandColor: defaultBrandColor(template),
    products: [blankProduct(0), blankProduct(1), blankProduct(2), blankProduct(3)],
  };
}

function normalizeExisting(demo: SavedDemo, lead: DemoLead): DemoForm {
  const products = (demo.products || []).map((product, index) => ({
    id: product.id || `product-${index + 1}`,
    name: product.name || "",
    price: String(product.price ?? ""),
    size: product.size || "",
    description: product.description || "",
    imageUrl: product.imageUrl || "",
  }));
  while (products.length < 4) products.push(blankProduct(products.length));
  const base = initialForm(lead);
  return {
    ...base,
    ...demo,
    city: demo.city || "",
    contactUrl: demo.contactUrl || "",
    heroImageUrl: demo.heroImageUrl || "",
    logoImageUrl: demo.logoImageUrl || "",
    brandColor: demo.brandColor || defaultBrandColor(demo.template || base.template),
    products,
  };
}

export function OutreachDemoStudio({ lead, token }: { lead: DemoLead; token: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DemoForm>(() => initialForm(lead));
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [quickProducts, setQuickProducts] = useState("");

  const eligible = !["NOT_INTERESTED", "WRONG_FIT", "DO_NOT_CONTACT"].includes(lead.replyStatus);

  async function openStudio() {
    setOpen(true);
    setNotice("");
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/outreach/demo?leadId=${encodeURIComponent(lead.id)}`, {
        headers: { "x-agentsiraji-admin-token": token },
        cache: "no-store",
      });
      const payload = (await response.json()) as DemoPayload;
      if (!response.ok) throw new Error(payload.error || "Demo could not be loaded.");
      if (payload.demo) {
        setForm(normalizeExisting(payload.demo, lead));
        setDemoUrl(`${window.location.origin}/demo/${payload.demo.slug}`);
      } else {
        setForm(initialForm(lead));
        setDemoUrl("");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Demo could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function product(index: number, patch: Partial<ProductRow>) {
    setForm((current) => ({
      ...current,
      products: current.products.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  function addProduct() {
    if (form.products.length >= 8) return;
    setForm((current) => ({ ...current, products: [...current.products, blankProduct(current.products.length)] }));
  }

  function applyQuickProducts() {
    const rows = quickProducts
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const imported: ProductRow[] = [];
    for (const row of rows) {
      const [name = "", rawPrice = "", size = "", description = "", imageUrl = ""] = row.split("|").map((part) => part.trim());
      const numericPrice = Number(rawPrice.replace(/[^0-9.]/g, ""));
      if (!name || !Number.isFinite(numericPrice) || numericPrice < 0) continue;
      imported.push({
        id: `product-${imported.length + 1}`,
        name,
        price: String(numericPrice),
        size,
        description,
        imageUrl,
      });
      if (imported.length >= 8) break;
    }

    if (imported.length < 1) {
      setNotice("Quick import format: Product name | price | size/variant | short description | optional image URL");
      return;
    }

    const loadedCount = imported.length;
    while (imported.length < 4) imported.push(blankProduct(imported.length));
    setForm((current) => ({ ...current, products: imported }));
    setNotice(`${loadedCount} product${loadedCount === 1 ? "" : "s"} loaded. Review the details, then generate the demo.`);
  }

  async function saveDemo() {
    const products = form.products
      .filter((item) => item.name.trim() && item.price.trim())
      .map((item) => ({ ...item, price: Number(item.price) }));
    if (products.length < 1) {
      setNotice("Add at least one product name and price.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/outreach/demo", {
        method: "POST",
        headers: { "content-type": "application/json", "x-agentsiraji-admin-token": token },
        body: JSON.stringify({ ...form, leadId: lead.id, products }),
      });
      const payload = (await response.json()) as DemoPayload;
      if (!response.ok || !payload.demo || !payload.demoUrl) throw new Error(payload.error || "Demo could not be generated.");
      const absolute = `${window.location.origin}${payload.demoUrl}`;
      setDemoUrl(absolute);
      setNotice("Personalized demo saved. Review it before sending to the prospect.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Demo could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!demoUrl) return;
    await navigator.clipboard.writeText(demoUrl);
    setNotice("Private demo link copied. After you actually send it, mark Demo on the lead card.");
  }

  if (!eligible) return null;

  const modal = open && typeof document !== "undefined" ? createPortal(
    <div
      style={modalStyle}
      role="presentation"
      onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}
    >
      <section style={panelStyle} role="dialog" aria-modal="true" aria-label={`Demo Studio for ${lead.businessName}`}>
        <div style={{ ...stickyHeaderStyle, ...rowStyle, justifyContent: "space-between" }}>
          <div>
            <span className="kicker">AgentSiraji Demo Studio</span>
            <h2 style={{ margin: ".2rem 0 0" }}>{lead.businessName}</h2>
            <p style={{ margin: ".25rem 0 0" }}>Build a personalized Commerce micro-demo. No new branch required.</p>
          </div>
          <button className="button" type="button" style={closeStyle} onClick={() => setOpen(false)} aria-label="Close Demo Studio">Close ×</button>
        </div>

        {notice && <div className="product-card" style={{ padding: ".7rem .85rem", marginTop: ".8rem" }}><strong>{notice}</strong></div>}

        <div style={{ ...gridStyle, marginTop: "1rem" }}>
          <label><strong>Business name</strong><br /><input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></label>
          <label><strong>Template</strong><br /><select value={form.template} onChange={(e) => { const template = e.target.value as DemoForm["template"]; setForm({ ...form, template, brandColor: defaultBrandColor(template) }); }}><option value="STANDARD">Standard commerce</option><option value="FOOD">Food & wellness</option><option value="FASHION">Fashion & beauty</option><option value="AGRI">Agriculture</option><option value="ELECTRONICS">Electronics</option><option value="HOME">Home & living</option></select></label>
          <label><strong>Country</strong><br /><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
          <label><strong>City</strong><br /><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label><strong>Currency code</strong><br /><input value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value.toUpperCase() })} /></label>
          <label><strong>Currency symbol</strong><br /><input value={form.currencySymbol} onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })} /></label>
        </div>

        <label style={{ display: "block", marginTop: ".75rem" }}><strong>Hero headline</strong><br /><input style={{ width: "100%" }} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></label>
        <div style={{ ...gridStyle, marginTop: ".75rem" }}>
          <label><strong>Logo image URL (optional)</strong><br /><input type="url" value={form.logoImageUrl} onChange={(e) => setForm({ ...form, logoImageUrl: e.target.value })} placeholder="https://..." /></label>
          <label><strong>Brand color</strong><br /><input type="color" value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} style={{ width: "100%", minHeight: "2.6rem" }} /></label>
          <label><strong>Hero image URL (optional)</strong><br /><input type="url" value={form.heroImageUrl} onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })} placeholder="https://..." /></label>
          <label><strong>Contact URL (optional)</strong><br /><input type="url" value={form.contactUrl} onChange={(e) => setForm({ ...form, contactUrl: e.target.value })} placeholder="https://wa.me/..." /></label>
          <label><strong>Contact button</strong><br /><input value={form.contactLabel} onChange={(e) => setForm({ ...form, contactLabel: e.target.value })} /></label>
        </div>

        <div style={{ ...rowStyle, justifyContent: "space-between", marginTop: "1rem" }}>
          <div><strong>Products</strong><div style={{ fontSize: ".82rem", opacity: .72 }}>Use 3–5 real products when possible. Image URLs are optional.</div></div>
          <button className="button" type="button" onClick={addProduct} disabled={form.products.length >= 8}>+ Product</button>
        </div>

        <details className="product-card" style={{ padding: ".8rem", marginTop: ".65rem" }}>
          <summary><strong>Quick product import</strong> · paste all products at once</summary>
          <p style={{ fontSize: ".82rem", margin: ".6rem 0" }}>One product per line: <strong>Name | price | size/variant | short description | optional image URL</strong></p>
          <textarea
            rows={6}
            value={quickProducts}
            onChange={(event) => setQuickProducts(event.target.value)}
            placeholder={"Example Product | 12 | Standard | Short benefit\nSecond Product | 8.5 | 250 ml | Short benefit"}
            style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
          <button className="button" type="button" onClick={applyQuickProducts} disabled={!quickProducts.trim()} style={{ marginTop: ".55rem" }}>Apply list →</button>
        </details>

        <div style={{ display: "grid", gap: ".65rem", marginTop: ".65rem" }}>
          {form.products.map((item, index) => (
            <article className="product-card" key={item.id} style={{ padding: ".8rem" }}>
              <div style={gridStyle}>
                <label><strong>Product {index + 1}</strong><br /><input value={item.name} onChange={(e) => product(index, { name: e.target.value })} placeholder="Product name" /></label>
                <label><strong>Price</strong><br /><input type="number" min="0" value={item.price} onChange={(e) => product(index, { price: e.target.value })} placeholder="0" /></label>
                <label><strong>Size / variant</strong><br /><input value={item.size} onChange={(e) => product(index, { size: e.target.value })} placeholder="25 kg / 250 ml / XL" /></label>
                <label><strong>Image URL</strong><br /><input type="url" value={item.imageUrl} onChange={(e) => product(index, { imageUrl: e.target.value })} placeholder="https://..." /></label>
              </div>
              <label style={{ display: "block", marginTop: ".55rem" }}><strong>Short description</strong><br /><input style={{ width: "100%" }} value={item.description} onChange={(e) => product(index, { description: e.target.value })} placeholder="One short product benefit or detail" /></label>
            </article>
          ))}
        </div>

        <div style={{ ...rowStyle, marginTop: "1rem", paddingBottom: ".25rem" }}>
          <button className="button button-primary" type="button" disabled={loading} onClick={() => void saveDemo()}>{loading ? "Saving…" : demoUrl ? "Update demo →" : "Generate demo →"}</button>
          {demoUrl && <a className="button" href={demoUrl} target="_blank" rel="noreferrer">Open demo ↗</a>}
          {demoUrl && <button className="button" type="button" onClick={() => void copyLink()}>Copy demo link</button>}
          <button className="button" type="button" onClick={() => setOpen(false)}>Close</button>
        </div>
        {demoUrl && <p style={{ fontSize: ".82rem", overflowWrap: "anywhere" }}><strong>Private share URL:</strong> {demoUrl}</p>}
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button className="button" type="button" onClick={() => void openStudio()}>
        {lead.status === "DEMO" || lead.status === "PROPOSAL" ? "Edit demo" : "Create demo"}
      </button>
      {modal}
    </>
  );
}
