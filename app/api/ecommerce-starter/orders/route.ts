import { NextResponse } from "next/server";
import { rateLimited, readJson, RequestError } from "@/lib/request-safety";
import { createStarterOrder, submitStarterPayment, cleanText, isBangladeshMobile,
  isStarterUuid, safeStarterUrl, starterLiveEnabled, STARTER_PRICE_BDT } from "@/lib/starter-offer";
import { sendMetaEvent, isMetaEventId } from "@/lib/meta";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
function blocked() {
  return json({ error: "This checkout is being prepared. Please contact AgentSiraji on WhatsApp." }, 503);
}
export async function POST(request: Request) {
  if (!starterLiveEnabled()) return blocked();
  if (rateLimited(request, "starter-new", 8)) return json({ error: "Please try again later." }, 429);
  try {
    const body = await readJson(request, 10_000);
    const fullName = cleanText(body.fullName, 100);
    const mobile = cleanText(body.mobile, 16).replace(/[\s-]/g, "");
    const email = cleanText(body.email, 120).toLowerCase();
    const businessName = cleanText(body.businessName, 100);
    const businessType = cleanText(body.businessType, 160);
    const facebookPage = cleanText(body.facebookPage, 500);
    if (body.website) return json({ ok: true });
    if (fullName.length < 2 || fullName.length > 100 || !isBangladeshMobile(mobile) ||
        !businessType || businessType.length > 160 ||
        (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
        !safeStarterUrl(facebookPage) || facebookPage.length > 500)
      return json({ error: "Name, Bangladesh mobile, business type or optional details are invalid." }, 400);
    const consent = body.marketingConsent === true;
    const checkoutEventId = consent && isMetaEventId(body.checkoutEventId)
      ? String(body.checkoutEventId) : undefined;
    const order = await createStarterOrder({
      fullName, mobile, email, businessName, businessType, facebookPage,
      marketingConsent: consent, checkoutEventId,
      fbp: consent ? cleanText(body.fbp, 200) : "",
      fbc: consent ? cleanText(body.fbc, 200) : "",
      utmSource: cleanText(body.utmSource, 100), utmMedium: cleanText(body.utmMedium, 100),
      utmCampaign: cleanText(body.utmCampaign, 120),
    });
    // The server event shares its ID with the browser event only after a saved checkout.
    if (consent && checkoutEventId) {
      await sendMetaEvent({
        eventName: "InitiateCheckout", eventId: checkoutEventId,
        eventSourceUrl: getSiteUrl() + "/ecommerce-starter",
        phone: mobile, email: email || undefined,
        fbp: cleanText(body.fbp, 200), fbc: cleanText(body.fbc, 200),
        clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        userAgent: request.headers.get("user-agent") || undefined,
        customData: { currency: "BDT", value: STARTER_PRICE_BDT, content_name: "AgentSiraji E-commerce Starter" },
      }).catch(() => undefined);
    }
    return json({ ok: true, ...order }, 201);
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    console.error("Starter order creation failed", error);
    return json({ error: "Could not save your order. Please try again." }, 500);
  }
}
export async function PATCH(request: Request) {
  if (!starterLiveEnabled()) return blocked();
  if (rateLimited(request, "starter-payment", 12)) return json({ error: "Please try again later." }, 429);
  try {
    const body = await readJson(request, 6000);
    const orderId = cleanText(body.orderId, 40);
    const accessToken = cleanText(body.accessToken, 100);
    const paymentMethod = body.paymentMethod;
    const transactionReference = cleanText(body.transactionReference, 100).toUpperCase();
    const submittedAmount = Number(body.submittedAmount);
    const proofUrl = cleanText(body.proofUrl, 500);
    if (!isStarterUuid(orderId) || !/^[A-Za-z0-9_-]{40,100}$/.test(accessToken) ||
        (paymentMethod !== "BKASH" && paymentMethod !== "CITY_BANK") ||
        !/^[A-Z0-9._:/ -]{5,100}$/.test(transactionReference) ||
        submittedAmount !== STARTER_PRICE_BDT || !safeStarterUrl(proofUrl) || proofUrl.length > 500)
      return json({ error: "Please enter valid payment method, ৳3,000 amount and transaction reference." }, 400);
    const result = await submitStarterPayment({
      orderId, accessToken, paymentMethod, transactionReference,
      submittedAmount, proofUrl,
    });
    return json({ ok: true, ...result, message: "Payment information received. Verification is pending. No Purchase has been recorded." });
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    // A unique transaction reference cannot be reused for multiple claims.
    console.error("Starter payment submission failed", error);
    return json({ error: "Payment proof could not be accepted. Check the reference or contact us on WhatsApp." }, 409);
  }
}
