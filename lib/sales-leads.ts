import { db } from "@/lib/db";

export const salesLeadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
export type SalesLeadStatus = (typeof salesLeadStatuses)[number];
export type SalesLeadType = "STORE_AUDIT" | "CONTACT";
export type SalesLeadPaymentStatus = "NOT_APPLICABLE" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export type SalesLeadInput = {
  leadType: SalesLeadType;
  businessName?: string | null;
  contactName?: string | null;
  country?: string | null;
  storeUrl?: string | null;
  email: string;
  phone?: string | null;
  productCount?: string | null;
  interest?: string | null;
  message?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
  metaEventId?: string | null;
  marketingConsent?: boolean;
  auditResult?: unknown;
  auditScanError?: string | null;
};

function text(value?: string | null, max = 500) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

export async function createSalesLead(input: SalesLeadInput) {
  const sql = db();
  const auditJson = input.auditResult === undefined ? null : JSON.stringify(input.auditResult);
  const rows = await sql`
    INSERT INTO sales_leads (
      lead_type, business_name, contact_name, country, store_url, email, phone,
      product_count, interest, message, utm_source, utm_medium, utm_campaign,
      utm_content, utm_term, referrer, landing_path, meta_event_id,
      marketing_consent, audit_result, audit_scan_error
    ) VALUES (
      ${input.leadType}, ${text(input.businessName, 100)}, ${text(input.contactName, 80)},
      ${text(input.country, 60)}, ${text(input.storeUrl, 500)}, ${input.email.trim().toLowerCase().slice(0, 120)},
      ${text(input.phone, 40)}, ${text(input.productCount, 40)}, ${text(input.interest, 120)},
      ${text(input.message, 2000)}, ${text(input.utmSource, 120)}, ${text(input.utmMedium, 120)},
      ${text(input.utmCampaign, 160)}, ${text(input.utmContent, 160)}, ${text(input.utmTerm, 160)},
      ${text(input.referrer, 500)}, ${text(input.landingPath, 500)}, ${text(input.metaEventId, 100)},
      ${Boolean(input.marketingConsent)}, ${auditJson}::jsonb, ${text(input.auditScanError, 1000)}
    )
    RETURNING id, status, created_at
  `;
  const row = rows[0];
  if (!row) throw new Error("Lead could not be saved.");
  await sql`
    INSERT INTO sales_lead_events (lead_id, event_type, to_status, note)
    VALUES (${String(row.id)}, 'CREATED', ${String(row.status)}, ${input.leadType})
  `;
  return { id: String(row.id), status: String(row.status) as SalesLeadStatus, createdAt: String(row.created_at) };
}

export async function listSalesLeads(limit = 100) {
  const sql = db();
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const rows = await sql`
    SELECT id, lead_type, status, business_name, contact_name, country, store_url,
      email, phone, product_count, interest, message, utm_source, utm_medium,
      utm_campaign, utm_content, utm_term, referrer, landing_path, meta_event_id,
      marketing_consent, audit_result, audit_scan_error, owner_note,
      payment_method, payment_reference, payment_status, created_at, updated_at
    FROM sales_leads
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
  return rows.map((row) => ({
    id: String(row.id),
    leadType: String(row.lead_type),
    status: String(row.status),
    businessName: row.business_name ? String(row.business_name) : null,
    contactName: row.contact_name ? String(row.contact_name) : null,
    country: row.country ? String(row.country) : null,
    storeUrl: row.store_url ? String(row.store_url) : null,
    email: String(row.email),
    phone: row.phone ? String(row.phone) : null,
    productCount: row.product_count ? String(row.product_count) : null,
    interest: row.interest ? String(row.interest) : null,
    message: row.message ? String(row.message) : null,
    utmSource: row.utm_source ? String(row.utm_source) : null,
    utmMedium: row.utm_medium ? String(row.utm_medium) : null,
    utmCampaign: row.utm_campaign ? String(row.utm_campaign) : null,
    utmContent: row.utm_content ? String(row.utm_content) : null,
    utmTerm: row.utm_term ? String(row.utm_term) : null,
    referrer: row.referrer ? String(row.referrer) : null,
    landingPath: row.landing_path ? String(row.landing_path) : null,
    metaEventId: row.meta_event_id ? String(row.meta_event_id) : null,
    marketingConsent: Boolean(row.marketing_consent),
    auditResult: row.audit_result ?? null,
    auditScanError: row.audit_scan_error ? String(row.audit_scan_error) : null,
    ownerNote: row.owner_note ? String(row.owner_note) : null,
    paymentMethod: row.payment_method ? String(row.payment_method) : null,
    paymentReference: row.payment_reference ? String(row.payment_reference) : null,
    paymentStatus: String(row.payment_status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function updateSalesLead(input: {
  id: string;
  status: SalesLeadStatus;
  ownerNote?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentStatus?: SalesLeadPaymentStatus;
}) {
  const sql = db();
  const current = await sql`SELECT status FROM sales_leads WHERE id = ${input.id} LIMIT 1`;
  if (!current[0]) throw new Error("Lead not found.");
  const fromStatus = String(current[0].status);
  const rows = await sql`
    UPDATE sales_leads SET
      status = ${input.status},
      owner_note = ${text(input.ownerNote, 2000)},
      payment_method = ${text(input.paymentMethod, 80)},
      payment_reference = ${text(input.paymentReference, 160)},
      payment_status = ${input.paymentStatus ?? "NOT_APPLICABLE"},
      updated_at = now()
    WHERE id = ${input.id}
    RETURNING id, status, updated_at
  `;
  const row = rows[0];
  await sql`
    INSERT INTO sales_lead_events (lead_id, event_type, from_status, to_status, note)
    VALUES (${input.id}, 'OWNER_UPDATE', ${fromStatus}, ${input.status}, ${text(input.ownerNote, 2000)})
  `;
  return { id: String(row.id), status: String(row.status), updatedAt: String(row.updated_at) };
}
