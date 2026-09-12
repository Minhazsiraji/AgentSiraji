import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readJson, RequestError, requestOriginAllowed } from "@/lib/request-safety";
import {
  envOrStored,
  readStoredIntegrations,
  redacted,
  saveStoredIntegrations,
  type IntegrationConfig,
} from "@/lib/integration-config";

export const dynamic = "force-dynamic";

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}

function authorized(request: Request) {
  const expected = process.env.INTEGRATIONS_ADMIN_TOKEN?.trim()
    || process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN?.trim()
    || process.env.BKASH_ADMIN_REVIEW_TOKEN?.trim();
  const supplied = request.headers.get("x-agentsiraji-admin-token") || "";
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function endpointOrigin(value: string) {
  try { return new URL(value).origin; } catch { return ""; }
}

function validGoogleTagId(value: string) {
  return /^(G-|AW-|GT-)[A-Z0-9_-]+$/i.test(value);
}

function publicStatus(config: IntegrationConfig) {
  const metaPixelId = envOrStored(config, "metaPixelId", "META_PIXEL_ID") || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  const metaToken = envOrStored(config, "metaCapiAccessToken", "META_CAPI_ACCESS_TOKEN");
  const googleId = envOrStored(config, "googleMeasurementId", "NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID");
  const leadUrl = envOrStored(config, "leadPilotUrl", "LEADPILOT_WEBSITE_LEADS_URL");
  const leadKey = envOrStored(config, "leadPilotIngestKey", "LEADPILOT_INGEST_KEY");
  const leadConfirmed = process.env.LEADPILOT_AGENTSIRAJI_ONLY_CONFIRMED === "true" || config.leadPilotConfirmed === true;
  return {
    meta: { configured: /^\d+$/.test(metaPixelId) && Boolean(metaToken), pixelId: redacted(metaPixelId, 5), testMode: process.env.VERCEL_ENV !== "production" },
    google: { configured: validGoogleTagId(googleId), measurementId: redacted(googleId, 4) },
    leadPilot: { configured: /^https:\/\//i.test(leadUrl) && Boolean(leadKey) && leadConfirmed, endpoint: endpointOrigin(leadUrl) },
  };
}

async function checkMeta(config: IntegrationConfig) {
  const pixelId = envOrStored(config, "metaPixelId", "META_PIXEL_ID") || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  const token = envOrStored(config, "metaCapiAccessToken", "META_CAPI_ACCESS_TOKEN");
  if (!/^\d+$/.test(pixelId) || !token) return { state: "missing", detail: "Add the AgentSiraji pixel ID and CAPI token." };
  const testEventCode = envOrStored(config, "metaTestEventCode", "META_TEST_EVENT_CODE");
  try {
    if (!testEventCode) return { state: "missing", detail: "Add the Meta Test Event Code before checking CAPI connectivity." };
    const fakeEmail = createHash("sha256").update("agentsiraji-health-check@example.invalid").digest("hex");
    const fakePhone = createHash("sha256").update("8801700000000").digest("hex");
    const response = await fetch(`https://graph.facebook.com/v26.0/${encodeURIComponent(pixelId)}/events`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ test_event_code: testEventCode, data: [{ event_name: "PageView", event_time: Math.floor(Date.now() / 1000), event_id: `agentsiraji_health_${randomUUID()}`, action_source: "website", event_source_url: "https://agentsiraji.com", user_data: { em: [fakeEmail], ph: [fakePhone] } }] }), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (response.ok) return { state: "healthy", detail: "Meta accepted a synthetic PageView in Test Events." };
    const payload = await response.json().catch(() => null) as { error?: { code?: unknown; error_subcode?: unknown } } | null;
    const code = typeof payload?.error?.code === "number" ? ` (code ${payload.error.code}${typeof payload.error.error_subcode === "number" ? `/${payload.error.error_subcode}` : ""})` : "";
    return { state: "error", detail: `Meta returned HTTP ${response.status}${code}. Check that the Pixel ID and CAPI token belong to the same AgentSiraji data source.` };
  } catch { return { state: "error", detail: "Meta could not be reached from the server." }; }
}

async function checkLeadPilot(config: IntegrationConfig) {
  const endpoint = envOrStored(config, "leadPilotUrl", "LEADPILOT_WEBSITE_LEADS_URL");
  const key = envOrStored(config, "leadPilotIngestKey", "LEADPILOT_INGEST_KEY");
  if (process.env.LEADPILOT_AGENTSIRAJI_ONLY_CONFIRMED !== "true" && config.leadPilotConfirmed !== true) return { state: "missing", detail: "Confirm that this endpoint belongs only to the AgentSiraji LeadPilot workspace." };
  if (!/^https:\/\//i.test(endpoint) || !key) return { state: "missing", detail: "Add the HTTPS LeadPilot lead endpoint and ingest key." };
  try {
    const response = await fetch(endpoint, { method: "HEAD", headers: { authorization: `Bearer ${key}` }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(6000) });
    return response.ok || response.status === 405 ? { state: "unverified", detail: `Endpoint reachable (HTTP ${response.status}). The ingest key and lead delivery have not been verified. Submit one test Store Audit and confirm it appears in LeadPilot.` } : { state: "error", detail: `LeadPilot returned HTTP ${response.status}.` };
  } catch { return { state: "error", detail: "LeadPilot could not be reached from the server." }; }
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized integration access." }, 401);
  try {
    const config = await readStoredIntegrations();
    const [meta, leadPilot] = await Promise.all([checkMeta(config), checkLeadPilot(config)]);
    const status = publicStatus(config);
    return json({ ok: true, status, checks: { meta, google: status.google.configured ? { state: "healthy", detail: "Google tag ID format is valid. A delivery check will be added in the dedicated Google tracking stage." } : { state: "missing", detail: "Add an AgentSiraji Google tag ID starting with G-, AW- or GT-." }, leadPilot } });
  } catch (error) {
    console.error("Integration health check failed", error);
    return json({ error: "Integration health could not be loaded." }, 500);
  }
}

export async function PUT(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized integration update." }, 401);
  if (!requestOriginAllowed(request)) return json({ error: "Request origin is not allowed." }, 403);
  try {
    const body = await readJson(request, 16_384);
    const config: IntegrationConfig = {
      metaPixelId: clean(body.metaPixelId, 40),
      metaCapiAccessToken: clean(body.metaCapiAccessToken, 500),
      metaTestEventCode: clean(body.metaTestEventCode, 120),
      googleMeasurementId: clean(body.googleMeasurementId, 80),
      googleApiSecret: clean(body.googleApiSecret, 200),
      leadPilotUrl: clean(body.leadPilotUrl, 500),
      leadPilotIngestKey: clean(body.leadPilotIngestKey, 500),
      leadPilotConfirmed: body.leadPilotConfirmed === true,
    };
    if (config.metaPixelId && !/^\d+$/.test(config.metaPixelId)) throw new RequestError("Meta pixel ID must contain digits only.");
    if (config.googleMeasurementId && !validGoogleTagId(config.googleMeasurementId)) throw new RequestError("Google tag ID must start with G-, AW- or GT-.");
    if (config.leadPilotUrl && !/^https:\/\//i.test(config.leadPilotUrl)) throw new RequestError("LeadPilot endpoint must use HTTPS.");

    const existing = await readStoredIntegrations();
    const leadDestinationChanged = Boolean(config.leadPilotUrl && config.leadPilotUrl !== existing.leadPilotUrl);
    const leadKeyChanged = Boolean(config.leadPilotIngestKey && config.leadPilotIngestKey !== existing.leadPilotIngestKey);
    if (leadDestinationChanged && !config.leadPilotIngestKey) {
      throw new RequestError("Changing the LeadPilot endpoint requires entering its ingest key again.");
    }
    if ((leadDestinationChanged || leadKeyChanged) && config.leadPilotConfirmed !== true) {
      throw new RequestError("Confirm that the LeadPilot endpoint and ingest key belong to AgentSiraji before replacing them.");
    }

    const merged = { ...existing, ...Object.fromEntries(Object.entries(config).filter(([key, value]) => key !== "leadPilotConfirmed" && typeof value === "string" && value.length > 0)) } as IntegrationConfig;
    merged.leadPilotConfirmed = leadDestinationChanged || leadKeyChanged
      ? true
      : existing.leadPilotConfirmed === true || config.leadPilotConfirmed === true;
    await saveStoredIntegrations(merged);
    return json({ ok: true, message: "Encrypted integration settings saved. Run the health check to verify each connection." });
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    console.error("Integration update failed", error);
    return json({ error: "Integration settings could not be saved." }, 500);
  }
}
