import { NextResponse } from "next/server";
import { submitManualPayment } from "@/lib/commercial-db";

const requiredFields = ["paymentId", "provider", "bankName", "senderName", "transactionReference", "amount", "paymentDate"] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxBodyBytes = 16_384;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

function boundedText(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  return text.length > 0 && text.length <= max ? text : null;
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production" && process.env.COMMERCIAL_LIVE_CHECKOUT_ENABLED !== "true") {
    return json({ error: "Live manual payment submission is not enabled yet." }, 503);
  }

  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json." }, 415);
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) {
      return json({ error: "Request is too large." }, 413);
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json({ error: "Request origin is not allowed." }, 403);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) {
      return json({ error: "Request is too large." }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON payload." }, 400);
    }

    if (!body || typeof body !== "object") {
      return json({ error: "Invalid manual payment submission." }, 400);
    }

    const data = body as Record<string, unknown>;
    const missing = requiredFields.filter((field) => {
      const value = data[field];
      return value === undefined || value === null || String(value).trim() === "";
    });
    if (missing.length > 0) {
      return json({ error: "Please complete every required payment field." }, 400);
    }

    const paymentId = String(data.paymentId).trim();
    if (!uuidPattern.test(paymentId)) {
      return json({ error: "The payment reference is invalid." }, 400);
    }

    if (data.provider !== "bank-transfer" && data.provider !== "manual-invoice") {
      return json({ error: "Unsupported manual payment provider." }, 400);
    }

    const bankName = boundedText(data.bankName, 120);
    const senderName = boundedText(data.senderName, 120);
    const transactionReference = boundedText(data.transactionReference, 160);
    const senderAccountHint = data.senderAccountHint ? boundedText(data.senderAccountHint, 80) : null;
    if (!bankName || !senderName || !transactionReference) {
      return json({ error: "One or more payment details are invalid or too long." }, 400);
    }

    const amount = Number(data.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000) {
      return json({ error: "The submitted payment amount is invalid." }, 400);
    }

    const paymentDate = String(data.paymentDate).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      return json({ error: "Payment date must use YYYY-MM-DD." }, 400);
    }
    const parsedDate = new Date(`${paymentDate}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== paymentDate) {
      return json({ error: "Payment date is invalid." }, 400);
    }

    let proofUrl: string | null = null;
    if (data.proofUrl) {
      const rawProof = boundedText(data.proofUrl, 1000);
      if (!rawProof) return json({ error: "Proof link is invalid." }, 400);
      try {
        const parsed = new URL(rawProof);
        if (parsed.protocol !== "https:") return json({ error: "Proof link must use HTTPS." }, 400);
        proofUrl = parsed.toString();
      } catch {
        return json({ error: "Proof link is invalid." }, 400);
      }
    }

    const submitted = await submitManualPayment({
      paymentId,
      provider: data.provider,
      bankName,
      senderName,
      senderAccountHint,
      transactionReference,
      submittedAmount: amount,
      paymentDate,
      proofUrl,
    });

    return json({
      ok: true,
      submissionId: submitted.submissionId,
      paymentId: submitted.paymentId,
      status: "under_review",
      activation: "blocked",
      message: "Payment evidence was saved for review. No subscription or entitlement has been activated.",
      nextAction: "An authorized AgentSiraji reviewer must independently verify the receipt/reference and approve it.",
    });
  } catch (error) {
    console.error("Manual payment submission failed", error);
    return json({ error: "The payment evidence could not be submitted. Please verify the reference and try again." }, 409);
  }
}
