import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export type OutreachDemoTemplate = "STANDARD" | "FOOD" | "FASHION" | "AGRI" | "ELECTRONICS" | "HOME";

export type OutreachDemoProduct = {
  id: string;
  name: string;
  price: number;
  size?: string;
  description?: string;
  imageUrl?: string;
};

export type OutreachDemo = {
  id: string;
  slug: string;
  leadId: string;
  businessName: string;
  country: string;
  city: string | null;
  template: OutreachDemoTemplate;
  tagline: string;
  currencyCode: string;
  currencySymbol: string;
  contactUrl: string | null;
  contactLabel: string;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  brandColor: string | null;
  products: OutreachDemoProduct[];
  createdAt: string;
  updatedAt: string;
};

function asIso(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

async function ensureOutreachDemoTable() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_demos (
      id uuid PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      lead_id uuid NOT NULL UNIQUE,
      business_name text NOT NULL,
      country text NOT NULL,
      city text,
      template text NOT NULL DEFAULT 'STANDARD',
      tagline text NOT NULL,
      currency_code text NOT NULL DEFAULT 'USD',
      currency_symbol text NOT NULL DEFAULT '$',
      contact_url text,
      contact_label text NOT NULL DEFAULT 'Contact us',
      hero_image_url text,
      logo_image_url text,
      brand_color text,
      products jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE outreach_demos ADD COLUMN IF NOT EXISTS logo_image_url text`;
  await sql`ALTER TABLE outreach_demos ADD COLUMN IF NOT EXISTS brand_color text`;
  await sql`CREATE INDEX IF NOT EXISTS outreach_demos_slug_idx ON outreach_demos (slug)`;
}

function safeProducts(value: unknown): OutreachDemoProduct[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      id: String(item.id || randomUUID()),
      name: String(item.name || ""),
      price: Number(item.price || 0),
      size: item.size ? String(item.size) : undefined,
      description: item.description ? String(item.description) : undefined,
      imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
    }))
    .filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0)
    .slice(0, 8);
}

function mapDemo(row: Record<string, unknown>): OutreachDemo {
  return {
    id: String(row.id),
    slug: String(row.slug),
    leadId: String(row.lead_id),
    businessName: String(row.business_name),
    country: String(row.country),
    city: row.city ? String(row.city) : null,
    template: String(row.template) as OutreachDemoTemplate,
    tagline: String(row.tagline),
    currencyCode: String(row.currency_code),
    currencySymbol: String(row.currency_symbol),
    contactUrl: row.contact_url ? String(row.contact_url) : null,
    contactLabel: String(row.contact_label),
    heroImageUrl: row.hero_image_url ? String(row.hero_image_url) : null,
    logoImageUrl: row.logo_image_url ? String(row.logo_image_url) : null,
    brandColor: row.brand_color ? String(row.brand_color) : null,
    products: safeProducts(row.products),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

function slugBase(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34);
  return base || "store";
}

export async function getOutreachDemoByLeadId(leadId: string) {
  await ensureOutreachDemoTable();
  const sql = db();
  const rows = await sql`SELECT * FROM outreach_demos WHERE lead_id = ${leadId} LIMIT 1`;
  return rows[0] ? mapDemo(rows[0] as Record<string, unknown>) : null;
}

export async function getOutreachDemoBySlug(slug: string) {
  await ensureOutreachDemoTable();
  const sql = db();
  const rows = await sql`SELECT * FROM outreach_demos WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? mapDemo(rows[0] as Record<string, unknown>) : null;
}

export async function saveOutreachDemo(input: {
  leadId: string;
  businessName: string;
  country: string;
  city?: string | null;
  template: OutreachDemoTemplate;
  tagline: string;
  currencyCode: string;
  currencySymbol: string;
  contactUrl?: string | null;
  contactLabel: string;
  heroImageUrl?: string | null;
  logoImageUrl?: string | null;
  brandColor?: string | null;
  products: OutreachDemoProduct[];
}) {
  await ensureOutreachDemoTable();
  const sql = db();
  const existing = await getOutreachDemoByLeadId(input.leadId);
  const productsJson = JSON.stringify(input.products.slice(0, 8));

  if (existing) {
    const rows = await sql`
      UPDATE outreach_demos SET
        business_name = ${input.businessName},
        country = ${input.country},
        city = ${input.city || null},
        template = ${input.template},
        tagline = ${input.tagline},
        currency_code = ${input.currencyCode},
        currency_symbol = ${input.currencySymbol},
        contact_url = ${input.contactUrl || null},
        contact_label = ${input.contactLabel},
        hero_image_url = ${input.heroImageUrl || null},
        logo_image_url = ${input.logoImageUrl || null},
        brand_color = ${input.brandColor || null},
        products = ${productsJson}::jsonb,
        updated_at = now()
      WHERE lead_id = ${input.leadId}
      RETURNING *
    `;
    return mapDemo(rows[0] as Record<string, unknown>);
  }

  const id = randomUUID();
  const slug = `${slugBase(input.businessName)}-${randomUUID().replaceAll("-", "").slice(0, 8)}`;
  const rows = await sql`
    INSERT INTO outreach_demos (
      id, slug, lead_id, business_name, country, city, template, tagline,
      currency_code, currency_symbol, contact_url, contact_label, hero_image_url,
      logo_image_url, brand_color, products
    ) VALUES (
      ${id}, ${slug}, ${input.leadId}, ${input.businessName}, ${input.country}, ${input.city || null},
      ${input.template}, ${input.tagline}, ${input.currencyCode}, ${input.currencySymbol},
      ${input.contactUrl || null}, ${input.contactLabel}, ${input.heroImageUrl || null},
      ${input.logoImageUrl || null}, ${input.brandColor || null}, ${productsJson}::jsonb
    )
    RETURNING *
  `;
  return mapDemo(rows[0] as Record<string, unknown>);
}
