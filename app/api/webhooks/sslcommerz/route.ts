import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
    return NextResponse.json({ error: "SSLCOMMERZ sandbox credentials are not configured." }, { status: 503 });
  }

  const form = await request.formData();
  const tranId = String(form.get("tran_id") ?? "");
  const valId = String(form.get("val_id") ?? "");

  if (!tranId || !valId) {
    return NextResponse.json({ error: "Missing SSLCOMMERZ transaction identifiers." }, { status: 400 });
  }

  // Deliberately do not trust the callback payload. The production implementation
  // must call SSLCOMMERZ's validation endpoint server-side and compare transaction,
  // amount, currency, and expected order state before recording PAID.
  return NextResponse.json(
    {
      ok: false,
      status: "verification_required",
      message: "Callback received. Server-side SSLCOMMERZ validation must complete before activation.",
    },
    { status: 202 },
  );
}
