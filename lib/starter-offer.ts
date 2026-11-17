import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

export const STARTER_SETUP_FEE_BDT = 3000 as const;
export const STARTER_HOSTING_MONTHLY_BDT = 2000 as const;
export const STARTER_PRICE_BDT = 5000 as const;
export const STARTER_BKASH = "01404385101";
export const STARTER_BANK = {
  name: "The City Bank PLC",
  accountName: "Md. Minhaz Siraji",
  accountNumber: "2183503557001",
  branch: "Ashulia Branch",
} as const;
export const starterLiveEnabled = () => process.env.STARTER_LIVE_PAYMENTS_ENABLED === "true";
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max + 1) : "";
export const isBangladeshMobile = (value: string) => /^01[3-9]\d{8}$/.test(value);
export const isStarterUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
export function safeStarterUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}
export type StarterLeadInput = {
  fullName: string; mobile: string; email?: string; businessName?: string;
  businessType: string; facebookPage?: string; marketingConsent: boolean;
  checkoutEventId?: string; fbp?: string; fbc?: string;
  utmSource?: string; utmMedium?: string; utmCampaign?: string;
};
export async function createStarterOrder(input: StarterLeadInput) {
  const token = randomBytes(32).toString("base64url");
  const sql = db();
  const rows = await sql`
    INSERT INTO starter_orders (
      access_token_hash, full_name, mobile, email, business_name, business_type,
      facebook_page, marketing_consent, checkout_event_id, fbp, fbc,
      utm_source, utm_medium, utm_campaign
    ) VALUES (
      ${sha256(token)}, ${input.fullName}, ${input.mobile}, ${input.email || null},
      ${input.businessName || null}, ${input.businessType}, ${input.facebookPage || null},
      ${input.marketingConsent}, ${input.checkoutEventId || null},
      ${input.marketingConsent ? input.fbp || null : null},
      ${input.marketingConsent ? input.fbc || null : null},
      ${input.utmSource || null}, ${input.utmMedium || null}, ${input.utmCampaign || null}
    )
    RETURNING id
  `;
  if (!rows[0]) throw new Error("Starter order could not be saved.");
  return { orderId: String(rows[0].id), accessToken: token, status: "PENDING_PAYMENT" as const };
}
export async function submitStarterPayment(input: {
  orderId: string; accessToken: string; paymentMethod: "BKASH" | "CITY_BANK";
  transactionReference: string; submittedAmount: number; proofUrl?: string;
}) {
  const sql = db();
  const rows = await sql`
    UPDATE starter_orders
    SET payment_method = ${input.paymentMethod}, transaction_reference = ${input.transactionReference},
      submitted_amount_bdt = ${input.submittedAmount}, proof_url = ${input.proofUrl || null},
      status = 'PENDING_VERIFICATION', submitted_at = now(), updated_at = now()
    WHERE id = ${input.orderId} AND access_token_hash = ${sha256(input.accessToken)}
      AND status = 'PENDING_PAYMENT' AND amount_bdt = ${input.submittedAmount}
    RETURNING id
  `;
  if (!rows[0]) throw new Error("Order was not found, has already been submitted, or the amount is incorrect.");
  return { orderId: String(rows[0].id), status: "PENDING_VERIFICATION" as const };
}
export async function getStarterOrders() {
  const sql = db();
  const rows = await sql`
    SELECT id, full_name, mobile, email, business_name, business_type,
      facebook_page, status, amount_bdt, payment_method, transaction_reference,
      submitted_amount_bdt, proof_url, submitted_at, verified_at,
      verification_note, purchase_event_result, purchase_event_processed_at,
      utm_source, utm_medium, utm_campaign, created_at
    FROM starter_orders ORDER BY created_at DESC LIMIT 100
  `;
  return rows.map(row => ({
    id: String(row.id), fullName: String(row.full_name), mobile: String(row.mobile),
    email: row.email ? String(row.email) : null,
    businessName: row.business_name ? String(row.business_name) : null,
    businessType: String(row.business_type), facebookPage: row.facebook_page ? String(row.facebook_page) : null,
    status: String(row.status), amountBdt: Number(row.amount_bdt),
    paymentMethod: row.payment_method ? String(row.payment_method) : null,
    transactionReference: row.transaction_reference ? String(row.transaction_reference) : null,
    submittedAmount: row.submitted_amount_bdt == null ? null : Number(row.submitted_amount_bdt),
    proofUrl: row.proof_url ? String(row.proof_url) : null,
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    verifiedAt: row.verified_at ? String(row.verified_at) : null,
    note: row.verification_note ? String(row.verification_note) : null,
    purchaseEventResult: String(row.purchase_event_result),
    purchaseEventProcessedAt: row.purchase_event_processed_at ? String(row.purchase_event_processed_at) : null,
    utmSource: row.utm_source ? String(row.utm_source) : null,
    utmMedium: row.utm_medium ? String(row.utm_medium) : null,
    utmCampaign: row.utm_campaign ? String(row.utm_campaign) : null,
    createdAt: String(row.created_at),
  }));
}
export async function reviewStarterOrder(input: {
  orderId: string; decision: "APPROVE" | "REJECT"; actorAccountId: string; note: string;
}) {
  const sql = db();
  const status = input.decision === "APPROVE" ? "PAID" : "REJECTED";
  const rows = await sql`
    UPDATE starter_orders SET status = ${status},
      verified_by_account_id = ${input.actorAccountId},
      verified_at = CASE WHEN ${status} = 'PAID' THEN now() ELSE NULL END,
      verification_note = ${input.note || null}, updated_at = now()
    WHERE id = ${input.orderId} AND status = 'PENDING_VERIFICATION'
      AND transaction_reference IS NOT NULL AND payment_method IS NOT NULL
      AND submitted_amount_bdt = ${STARTER_PRICE_BDT}
    RETURNING id, status
  `;
  if (!rows[0]) throw new Error("Already reviewed, insufficient evidence, or incorrect amount.");
  return { orderId: String(rows[0].id), status: String(rows[0].status) };
}
export async function claimStarterPurchase(orderId: string) {
  const sql = db();
  const rows = await sql`
    UPDATE starter_orders SET purchase_event_claimed_at = now(),
      purchase_event_result = 'PENDING', updated_at = now()
    WHERE id = ${orderId} AND status = 'PAID' AND purchase_event_processed_at IS NULL
      AND (purchase_event_claimed_at IS NULL OR purchase_event_claimed_at < now() - interval '10 minutes')
    RETURNING id, mobile, email, marketing_consent, fbp, fbc, verified_at, amount_bdt
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    orderId: String(row.id), mobile: String(row.mobile),
    email: row.email ? String(row.email) : undefined,
    marketingConsent: Boolean(row.marketing_consent),
    fbp: row.fbp ? String(row.fbp) : undefined, fbc: row.fbc ? String(row.fbc) : undefined,
    verifiedAt: String(row.verified_at), amount: Number(row.amount_bdt),
    eventId: `as_starter_purchase_${String(row.id)}`,
  };
}
export async function finishStarterPurchase(input: {
  orderId: string; result: "SENT" | "SKIPPED_CONSENT" | "FAILED";
}) {
  const sql = db();
  const completed = input.result !== "FAILED";
  await sql`
    UPDATE starter_orders SET purchase_event_result = ${input.result},
      purchase_event_processed_at = CASE WHEN ${completed} THEN now() ELSE NULL END,
      purchase_event_claimed_at = NULL, updated_at = now()
    WHERE id = ${input.orderId} AND status = 'PAID' AND purchase_event_claimed_at IS NOT NULL
  `;
}

export async function getStarterOrderStatus(orderId: string, accessToken: string) {
  const sql = db();
  const rows = await sql`
    SELECT status, purchase_event_result, verified_at
    FROM starter_orders
    WHERE id = ${orderId} AND access_token_hash = ${sha256(accessToken)}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    status: String(row.status),
    purchaseEventResult: String(row.purchase_event_result),
    verifiedAt: row.verified_at ? String(row.verified_at) : null,
    verifiedEventId: row.status === "PAID" ? `as_starter_purchase_${orderId}` : null,
  };
}
