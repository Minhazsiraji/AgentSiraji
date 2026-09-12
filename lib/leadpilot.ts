import { envOrStored, readStoredIntegrations, type IntegrationConfig } from "@/lib/integration-config";

export type LeadPilotLeadInput = {
  customerName: string;
  email?: string | null;
  phone?: string | null;
  service: string;
  location?: string | null;
  expectedValue?: number | null;
  message?: string | null;
  pageUrl: string;
  sourceName: string;
};

export type LeadPilotDeliveryResult = {
  configured: boolean;
  delivered: boolean;
  status?: number;
  leadId?: string;
  duplicate?: boolean;
};

export type LeadPilotProbeResult = {
  state: "missing" | "healthy" | "error";
  detail: string;
  status?: number;
};

function connection(config: IntegrationConfig) {
  const endpoint = envOrStored(config, "leadPilotUrl", "LEADPILOT_WEBSITE_LEADS_URL");
  const key = envOrStored(config, "leadPilotIngestKey", "LEADPILOT_INGEST_KEY");
  const confirmed = process.env.LEADPILOT_AGENTSIRAJI_ONLY_CONFIRMED === "true" || config.leadPilotConfirmed === true;
  let validEndpoint = false;
  try { validEndpoint = new URL(endpoint).protocol === "https:"; } catch { validEndpoint = false; }
  return { endpoint, key, confirmed, configured: validEndpoint && Boolean(key) && confirmed };
}

export async function deliverLeadToLeadPilot(input: LeadPilotLeadInput): Promise<LeadPilotDeliveryResult> {
  let stored: IntegrationConfig;
  try { stored = await readStoredIntegrations(); } catch { stored = {}; }
  const resolved = connection(stored);
  if (!resolved.configured) return { configured: false, delivered: false };

  try {
    const response = await fetch(resolved.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${resolved.key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        customerName: input.customerName.trim().slice(0, 120),
        email: input.email?.trim().slice(0, 200) || "",
        phone: input.phone?.trim().slice(0, 40) || "",
        service: input.service.trim().slice(0, 200),
        location: input.location?.trim().slice(0, 300) || "",
        expectedValue: Number.isFinite(input.expectedValue) && Number(input.expectedValue) > 0 ? Number(input.expectedValue) : 0,
        message: input.message?.trim().slice(0, 5000) || "",
        pageUrl: input.pageUrl.slice(0, 500),
        sourceName: input.sourceName.trim().slice(0, 80),
      }),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const payload = await response.json().catch(() => null) as { ok?: unknown; leadId?: unknown; duplicate?: unknown } | null;
    const delivered = response.ok && payload?.ok === true;
    return {
      configured: true,
      delivered,
      status: response.status,
      ...(typeof payload?.leadId === "string" || typeof payload?.leadId === "number" ? { leadId: String(payload.leadId) } : {}),
      ...(typeof payload?.duplicate === "boolean" ? { duplicate: payload.duplicate } : {}),
    };
  } catch {
    return { configured: true, delivered: false };
  }
}

export async function probeLeadPilotConnection(config?: IntegrationConfig): Promise<LeadPilotProbeResult> {
  let stored = config;
  if (!stored) {
    try { stored = await readStoredIntegrations(); } catch { stored = {}; }
  }
  const resolved = connection(stored);
  if (!resolved.confirmed) return { state: "missing", detail: "Confirm that this endpoint belongs only to the AgentSiraji LeadPilot workspace." };
  if (!resolved.configured) return { state: "missing", detail: "Add the HTTPS LeadPilot website-lead endpoint and ingest key." };

  try {
    const response = await fetch(resolved.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${resolved.key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
    });
    await response.body?.cancel().catch(() => undefined);
    if (response.status === 400) {
      return {
        state: "healthy",
        status: response.status,
        detail: "LeadPilot accepted the AgentSiraji ingest key and reached lead validation. The probe intentionally stopped before creating a lead.",
      };
    }
    if (response.status === 401) return { state: "error", status: 401, detail: "LeadPilot rejected the configured ingest key." };
    if (response.status === 403) return { state: "error", status: 403, detail: "LeadPilot rejected this server connection. Review the website integration allowlist." };
    return { state: "error", status: response.status, detail: `LeadPilot validation probe returned HTTP ${response.status}.` };
  } catch {
    return { state: "error", detail: "LeadPilot could not be reached from the AgentSiraji server." };
  }
}
