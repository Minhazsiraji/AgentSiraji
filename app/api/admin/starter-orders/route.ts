import { NextResponse } from "next/server";
import { platformAdminSession } from "@/lib/admin-access";
import { readJson, RequestError, rateLimited } from "@/lib/request-safety";
import { claimStarterPurchase, finishStarterPurchase, getStarterOrders,
  isStarterUuid, reviewStarterOrder, STARTER_PRICE_BDT } from "@/lib/starter-offer";
import { sendVerifiedStarterPurchaseEvent } from "@/lib/meta";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
async function sendPurchaseAfterVerification(orderId: string) {
  const claim = await claimStarterPurchase(orderId);
  if (!claim) return { tracking: "already_processed_or_in_progress" };
  if (!claim.marketingConsent) {
    await finishStarterPurchase({ orderId, result: "SKIPPED_CONSENT" });
    return { tracking: "skipped_no_marketing_consent" };
  }
  try {
    const result = await sendVerifiedStarterPurchaseEvent({
      eventId: claim.eventId,
      eventTime: Math.floor(new Date(claim.verifiedAt).getTime() / 1000),
      eventSourceUrl: getSiteUrl() + "/ecommerce-starter",
      phone: claim.mobile, email: claim.email, fbp: claim.fbp, fbc: claim.fbc,
      customData: { value: STARTER_PRICE_BDT, currency: "BDT", content_name: "AgentSiraji E-commerce Starter", order_id: claim.orderId },
    });
    await finishStarterPurchase({ orderId, result: result.sent ? "SENT" : "FAILED" });
    return { tracking: result.sent ? "purchase_capi_sent" : "purchase_capi_needs_retry" };
  } catch (error) {
    console.error("Verified starter Purchase dispatch failed", error);
    await finishStarterPurchase({ orderId, result: "FAILED" });
    return { tracking: "purchase_capi_needs_retry" };
  }
}
export async function GET(request: Request) {
  const admin = await platformAdminSession(request);
  if (!admin) return json({ error: "Unauthorized." }, 401);
  try { return json({ ok: true, orders: await getStarterOrders() }); }
  catch (error) {
    console.error("Starter admin listing failed", error);
    return json({ error: "Could not load orders. Make sure migration 0008 is applied." }, 503);
  }
}
export async function PATCH(request: Request) {
  const admin = await platformAdminSession(request);
  if (!admin) return json({ error: "Unauthorized." }, 401);
  if (rateLimited(request, "starter-admin-review", 80)) return json({ error: "Too many requests." }, 429);
  try {
    const body = await readJson(request, 4000);
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const decision = body.decision;
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!isStarterUuid(orderId) || !["APPROVE", "REJECT", "RETRY_PURCHASE"].includes(String(decision)))
      return json({ error: "Valid order ID and decision required." }, 400);
    if (decision === "RETRY_PURCHASE") {
      return json({ ok: true, orderId, ...(await sendPurchaseAfterVerification(orderId)) });
    }
    if (note.length < 8 || note.length > 1000)
      return json({ error: "Record a verification note (8–1000 characters)." }, 400);
    if (decision === "APPROVE" && body.confirmedBankReceipt !== true)
      return json({ error: "Independently verify the transfer in bKash/bank records before approval." }, 400);
    const reviewed = await reviewStarterOrder({
      orderId, decision: decision as "APPROVE" | "REJECT",
      actorAccountId: admin.accountId, note,
    });
    const tracking = decision === "APPROVE" ? await sendPurchaseAfterVerification(orderId) : { tracking: "not_a_purchase" };
    return json({ ok: true, ...reviewed, ...tracking });
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    console.error("Starter payment review rejected", error);
    return json({ error: "Review could not be applied. Check order status and payment evidence." }, 409);
  }
}
