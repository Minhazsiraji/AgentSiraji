import { NextResponse } from "next/server";
import { platformAdminSession } from "@/lib/admin-access";
import { getSalesAnalytics } from "@/lib/sales-analytics";

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function GET(request: Request) {
  const admin = await platformAdminSession(request);
  if (!admin) return json({ error: "Unauthorized analytics access." }, 401);

  try {
    const analytics = await getSalesAnalytics();
    return json({ ok: true, analytics });
  } catch (error) {
    console.error("Admin analytics failed", error);
    return json({ error: "Analytics are temporarily unavailable." }, 500);
  }
}
