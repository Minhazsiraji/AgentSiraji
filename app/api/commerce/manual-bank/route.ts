import { NextResponse } from "next/server";
import { submitManualPayment } from "@/lib/commercial-db";

const requiredFields = ["paymentId", "provider", "bankName", "senderName", "transactionReference", "amount", "paymentDate"] as const;

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid manual payment submission." }, { status: 400 });
    }
    const data = body as Record<string, unknown>;
    const missing = requiredFields.filter((field) => {
      const value = data[field];
      return value === undefined || value === null || String(value).trim() === "";
    });
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}.` }, { status: 400 });
    }
    if (data.provider !== "bank-transfer" && data.provider !== "manual-invoice") {
      return NextResponse.json({ error: "Unsupported manual payment provider." }, { status: 400 });
    }
    const amount = Number(data.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Payment amount must be supplied in the checkout's smallest currency unit." }, { status: 400 });
    }
    const paymentDate = String(data.paymentDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      return NextResponse.json({ error: "Payment date must use YYYY-MM-DD." }, { status: 400 });
    }

    const submitted = await submitManualPayment({
      paymentId: String(data.paymentId),
      provider: data.provider,
      bankName: String(data.bankName),
      senderName: String(data.senderName),
      senderAccountHint: data.senderAccountHint ? String(data.senderAccountHint) : null,
      transactionReference: String(data.transactionReference),
      submittedAmount: amount,
      paymentDate,
      proofUrl: data.proofUrl ? String(data.proofUrl) : null,
    });

    return NextResponse.json({
      ok: true,
      submissionId: submitted.submissionId,
      paymentId: submitted.paymentId,
      status: "under_review",
      activation: "blocked",
      message: "Payment evidence was saved for review. No subscription or entitlement has been activated.",
      nextAction: "An authorized AgentSiraji reviewer must independently verify the receipt/reference and approve it.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual payment submission failed.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
