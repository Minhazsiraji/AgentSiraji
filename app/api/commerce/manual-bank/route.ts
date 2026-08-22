import { NextResponse } from "next/server";

const requiredFields = ["bankName", "senderName", "transactionReference", "amount", "paymentDate"] as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid bank-transfer submission." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const missing = requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}.` }, { status: 400 });
  }

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Payment amount must be greater than zero." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    status: "under_review",
    activation: "blocked",
    message: "Test bank-transfer proof accepted for review. No subscription or entitlement has been activated.",
    nextAction: "An authorized AgentSiraji admin must verify the bank receipt and approve the payment before activation.",
  });
}
