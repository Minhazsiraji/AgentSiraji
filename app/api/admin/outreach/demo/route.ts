import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getOutreachDashboard } from "@/lib/outreach-db";
import {
  getOutreachDemoByLeadId,
  saveOutreachDemo,
  type OutreachDemoProduct,
  type OutreachDemoTemplate,
} from "@/lib/outreach-demo-db";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedTemplates = new Set<OutreachDemoTemplate>(["STANDARD", "FOOD", "FASHION", "AGRI", "ELECTRONICS", "HOME"]);
const maxBodyBytes = 40_000;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

function authorized(request: Request) {
  const expected = process.env.OUTREACH_ADMIN_TOKEN || process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN;
  const supplied = request.headers.get("x-agentsiraji-admin-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  const cleaned = value.trim();
  return cleaned.length <= max ? cleaned : "";
}

function httpUrl(value: string) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function parseProducts(value: unknown): OutreachDemoProduct[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) throw new Error("PRODUCTS");
  return value.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("PRODUCTS");
    const item = raw as Record<string, unknown>;
    const name = text(item.name, 120);
    const size = text(item.size, 80);
    const description = text(item.description, 240);
    const imageUrl = text(item.imageUrl, 600);
    const price = Number(item.price);
    if (!name || !Number.isFinite(price) || price < 0 || price > 1_000_000_000) throw new Error("PRODUCTS");
    if (imageUrl && !httpUrl(imageUrl)) throw new Error("IMAGE_URL");
    return {
      id: text(item.id, 80) || `product-${index + 1}`,
      name,
      price,
      size: size || undefined,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    };
  });
}

async function body(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("MEDIA");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBodyBytes) throw new Error("SIZE");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function resolveLead(input: { leadId?: string; profileUrl?: string }) {
  const dashboard = await getOutreachDashboard();
  const leadId = input.leadId || "";
  const profileUrl = input.profileUrl || "";
  if (uuidPattern.test(leadId)) return dashboard.leads.find((item) => item.id === leadId) || null;
  if (profileUrl && httpUrl(profileUrl)) return dashboard.leads.find((item) => item.profileUrl === profileUrl) || null;
  return null;
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized outreach access." }, 401);
  const url = new URL(request.url);
  const lead = await resolveLead({
    leadId: url.searchParams.get("leadId") || "",
    profileUrl: url.searchParams.get("profileUrl") || "",
  });
  if (!lead) return json({ error: "Lead was not found." }, 404);
  if (lead.closed || lead.isPartner) return json({ error: "This lead is not eligible for a Commerce demo." }, 409);
  const demo = await getOutreachDemoByLeadId(lead.id);
  return json({ ok: true, demo, lead });
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized outreach access." }, 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);

  try {
    const input = await body(request);
    const lead = await resolveLead({ leadId: text(input.leadId, 64), profileUrl: text(input.profileUrl, 600) });
    if (!lead || lead.closed || lead.isPartner) return json({ error: "This lead is not eligible for a Commerce demo." }, 409);

    const template = text(input.template, 30) as OutreachDemoTemplate;
    if (!allowedTemplates.has(template)) return json({ error: "Select a valid demo template." }, 400);

    const businessName = text(input.businessName, 160);
    const country = text(input.country, 80);
    const city = text(input.city, 80);
    const tagline = text(input.tagline, 180);
    const currencyCode = text(input.currencyCode, 8).toUpperCase();
    const currencySymbol = text(input.currencySymbol, 12);
    const contactUrl = text(input.contactUrl, 600);
    const contactLabel = text(input.contactLabel, 60) || "Contact us";
    const heroImageUrl = text(input.heroImageUrl, 600);
    const products = parseProducts(input.products);

    if (!businessName || !country || !tagline || !currencyCode || !currencySymbol) {
      return json({ error: "Business name, country, tagline and currency are required." }, 400);
    }
    if ((contactUrl && !httpUrl(contactUrl)) || (heroImageUrl && !httpUrl(heroImageUrl))) {
      return json({ error: "Contact and image URLs must be valid http(s) URLs." }, 400);
    }

    const demo = await saveOutreachDemo({
      leadId: lead.id,
      businessName,
      country,
      city: city || null,
      template,
      tagline,
      currencyCode,
      currencySymbol,
      contactUrl: contactUrl || null,
      contactLabel,
      heroImageUrl: heroImageUrl || null,
      products,
    });

    return json({ ok: true, demo, lead, demoUrl: `/demo/${demo.slug}` }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "MEDIA") return json({ error: "Content-Type must be application/json." }, 415);
    if (message === "SIZE") return json({ error: "Demo request is too large." }, 413);
    if (message === "PRODUCTS") return json({ error: "Add 1–8 valid products with a name and price." }, 400);
    if (message === "IMAGE_URL") return json({ error: "Product image URLs must be valid http(s) URLs." }, 400);
    if (error instanceof SyntaxError) return json({ error: "Invalid JSON payload." }, 400);
    console.error("Outreach demo save failed", error);
    return json({ error: "Demo could not be saved." }, 500);
  }
}
