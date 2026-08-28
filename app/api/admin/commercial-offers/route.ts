import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  listCommercialProductsAndOffers,
  upsertCommercialOffer,
  type CommercialMarket,
} from "@/lib/commercial-offers";

const maxBodyBytes = 24_576;
const marketValues = new Set(["BD", "INTL", "EMERGING"]);
const codePattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
const currencyPattern = /^[A-Z]{3}$/;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

function authorized(request: Request) {
  const expected = process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN;
  const supplied = request.headers.get("x-agentsiraji-admin-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

function nullableAmount(value: unknown) {
  if (value === null || value === "" || typeof value === "undefined") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 10_000_000) throw new Error("Invalid amount.");
  return number;
}

function nullableDate(value: unknown) {
  if (value === null || value === "" || typeof value === "undefined") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Invalid offer date.");
  return date.toISOString();
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized commercial configuration access." }, 401);
  try {
    return json({ ok: true, products: await listCommercialProductsAndOffers() });
  } catch (error) {
    console.error("Commercial offer listing failed", error);
    return json({ error: "Commercial configuration could not be loaded." }, 500);
  }
}

export async function PUT(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized commercial configuration update." }, 401);

  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json." }, 415);
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) return json({ error: "Request is too large." }, 413);
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) return json({ error: "Request is too large." }, 413);

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON payload." }, 400);
    }

    const productCode = String(body.productCode ?? "").trim();
    const planCode = String(body.planCode ?? "").trim();
    const planName = String(body.planName ?? "").trim();
    const market = String(body.market ?? "").trim();
    const currency = String(body.currency ?? "").trim().toUpperCase();
    const billingUnit = String(body.billingUnit ?? "").trim();
    const offerUnitLabel = String(body.offerUnitLabel ?? "").trim() || null;
    const usageLimits = body.usageLimits && typeof body.usageLimits === "object" && !Array.isArray(body.usageLimits)
      ? body.usageLimits as Record<string, unknown>
      : {};
    const sortOrder = Number(body.sortOrder ?? 0);

    if (
      !codePattern.test(productCode) || !codePattern.test(planCode) || planName.length < 1 || planName.length > 80 ||
      !marketValues.has(market) || !currencyPattern.test(currency) || billingUnit.length < 1 || billingUnit.length > 40 ||
      (offerUnitLabel && offerUnitLabel.length > 80) || !Number.isInteger(sortOrder) || Math.abs(sortOrder) > 10_000 ||
      JSON.stringify(usageLimits).length > 8_000
    ) {
      return json({ error: "Please check the commercial configuration fields." }, 400);
    }

    const offerStartsAt = nullableDate(body.offerStartsAt);
    const offerEndsAt = nullableDate(body.offerEndsAt);
    if (offerStartsAt && offerEndsAt && new Date(offerStartsAt) >= new Date(offerEndsAt)) {
      return json({ error: "Offer end must be after offer start." }, 400);
    }

    const result = await upsertCommercialOffer({
      productCode,
      planCode,
      planName,
      market: market as CommercialMarket,
      currency,
      regularPrice: nullableAmount(body.regularPrice),
      offerPrice: nullableAmount(body.offerPrice),
      annualPrice: nullableAmount(body.annualPrice),
      billingUnit,
      offerUnitLabel,
      offerEnabled: Boolean(body.offerEnabled),
      offerStartsAt,
      offerEndsAt,
      salesEnabled: Boolean(body.salesEnabled),
      usageLimits,
      sortOrder,
    });

    return json({ ok: true, ...result });
  } catch (error) {
    console.error("Commercial offer update failed", error);
    return json({ error: "Commercial configuration could not be saved." }, 409);
  }
}
