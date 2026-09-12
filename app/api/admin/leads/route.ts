import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { listSalesLeads, salesLeadStatuses, updateSalesLead, type SalesLeadPaymentStatus, type SalesLeadStatus } from "@/lib/sales-leads";

const paymentStatuses = new Set<SalesLeadPaymentStatus>(["NOT_APPLICABLE", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"]);

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}

function authorized(request: Request) {
  const expected = process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN;
  const supplied = request.headers.get("x-agentsiraji-admin-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized lead access." }, 401);
  try {
    const leads = await listSalesLeads(100);
    return json({ ok: true, leads });
  } catch (error) {
    console.error("Lead list failed", error);
    return json({ error: "Lead list is unavailable." }, 500);
  }
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized lead update." }, 401);
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Content-Type must be application/json." }, 415);
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id ?? "").trim();
    const status = String(body.status ?? "").trim() as SalesLeadStatus;
    const ownerNote = typeof body.ownerNote === "string" ? body.ownerNote.trim() : "";
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.trim() : "";
    const paymentReference = typeof body.paymentReference === "string" ? body.paymentReference.trim() : "";
    const paymentStatus = String(body.paymentStatus ?? "NOT_APPLICABLE") as SalesLeadPaymentStatus;
    if (!/^\d{1,20}$/.test(id) || !salesLeadStatuses.includes(status) || !paymentStatuses.has(paymentStatus)) {
      return json({ error: "Invalid lead update." }, 400);
    }
    if (ownerNote.length > 2000 || paymentMethod.length > 80 || paymentReference.length > 160) {
      return json({ error: "Lead update is too long." }, 400);
    }
    const result = await updateSalesLead({
      id,
      status,
      ownerNote: ownerNote || null,
      paymentMethod: paymentMethod || null,
      paymentReference: paymentReference || null,
      paymentStatus,
    });
    return json({ ok: true, ...result });
  } catch (error) {
    console.error("Lead update failed", error);
    return json({ error: "Lead update could not be completed." }, 409);
  }
}
