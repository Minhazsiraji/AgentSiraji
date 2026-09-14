import { NextResponse } from "next/server";
import { platformAdminSession } from "@/lib/admin-access";
import { pilotPlanCodes, provisionVerifiedBkashLead } from "@/lib/pilot-provisioning";
import {
  bkashPilotPaymentMethod,
  listSalesLeads,
  salesLeadStatuses,
  updateSalesLead,
  type SalesLeadPaymentStatus,
  type SalesLeadStatus,
} from "@/lib/sales-leads";

const paymentStatuses = new Set<SalesLeadPaymentStatus>(["NOT_APPLICABLE", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"]);
const pilotPlans = new Set<string>(pilotPlanCodes);

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  const admin = await platformAdminSession(request);
  if (!admin) return json({ error: "Unauthorized lead access." }, 401);
  try {
    const leads = await listSalesLeads(100);
    return json({ ok: true, leads });
  } catch (error) {
    console.error("Lead list failed", error);
    return json({ error: "Lead list is unavailable." }, 500);
  }
}

export async function PATCH(request: Request) {
  const admin = await platformAdminSession(request);
  if (!admin) return json({ error: "Unauthorized lead update." }, 401);
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Content-Type must be application/json." }, 415);
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id ?? "").trim();
    const status = String(body.status ?? "").trim() as SalesLeadStatus;
    const ownerNote = optionalString(body.ownerNote);
    const paymentMethod = optionalString(body.paymentMethod);
    const paymentReference = optionalString(body.paymentReference);
    const paymentSenderHint = optionalString(body.paymentSenderHint);
    const paymentDate = optionalString(body.paymentDate);
    const paymentVerificationNote = optionalString(body.paymentVerificationNote);
    const paymentStatus = String(body.paymentStatus ?? "NOT_APPLICABLE") as SalesLeadPaymentStatus;
    const paymentExpectedAmount = optionalNumber(body.paymentExpectedAmount);
    const paymentVerifiedAmount = optionalNumber(body.paymentVerifiedAmount);
    const planCode = optionalString(body.planCode).toLowerCase();

    if (!/^\d{1,20}$/.test(id) || !salesLeadStatuses.includes(status) || !paymentStatuses.has(paymentStatus)) {
      return json({ error: "Invalid lead update." }, 400);
    }
    if (
      ownerNote.length > 2000 || paymentMethod.length > 80 || paymentReference.length > 160 ||
      paymentSenderHint.length > 40 || paymentVerificationNote.length > 1000 || planCode.length > 20 ||
      Number.isNaN(paymentExpectedAmount) || Number.isNaN(paymentVerifiedAmount)
    ) {
      return json({ error: "Invalid bKash payment details." }, 400);
    }
    if (paymentStatus !== "NOT_APPLICABLE" && paymentMethod !== bkashPilotPaymentMethod) {
      return json({ error: "Pilot payments must use bKash Send Money." }, 400);
    }
    if (status === "WON" && paymentStatus === "VERIFIED" && !pilotPlans.has(planCode)) {
      return json({ error: "Select Starter, Growth or Pro before activating a verified customer." }, 400);
    }

    const result = await updateSalesLead({
      id,
      status,
      ownerNote: ownerNote || null,
      paymentMethod: paymentMethod || null,
      paymentReference: paymentReference || null,
      paymentStatus,
      paymentExpectedAmount,
      paymentVerifiedAmount,
      paymentSenderHint: paymentSenderHint || null,
      paymentDate: paymentDate || null,
      paymentVerificationNote: paymentVerificationNote || null,
    });

    if (status === "WON" && paymentStatus === "VERIFIED") {
      try {
        const provisioning = await provisionVerifiedBkashLead({ leadId: id, planCode, actorAccountId: admin.accountId });
        return json({ ok: true, ...result, provisioning, provisioningRequired: false });
      } catch (error) {
        console.error("Verified lead customer provisioning needs retry", error);
        return json({
          ok: true,
          ...result,
          provisioning: null,
          provisioningRequired: true,
          provisioningMessage: "Payment is saved as verified, but customer provisioning did not complete. Correct any plan or amount issue and retry this same lead before onboarding.",
        }, 202);
      }
    }

    return json({ ok: true, ...result, provisioning: null, provisioningRequired: false });
  } catch (error) {
    console.error("Lead update failed", error);
    return json({ error: error instanceof Error ? error.message : "Lead update could not be completed." }, 409);
  }
}
