import { measurementConsentModeForCountry } from "@/lib/measurement-region";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");
  return Response.json(
    { mode: measurementConsentModeForCountry(country) },
    { headers: { "cache-control": "private, no-store, max-age=0" } },
  );
}
