import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

export type IntegrationConfig = {
  metaPixelId?: string;
  metaCapiAccessToken?: string;
  metaTestEventCode?: string;
  googleMeasurementId?: string;
  googleApiSecret?: string;
  leadPilotUrl?: string;
  leadPilotIngestKey?: string;
  leadPilotConfirmed?: boolean;
};

const tableSql = `
  CREATE TABLE IF NOT EXISTS agentsiraji_integrations (
    id text PRIMARY KEY,
    encrypted_config text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`;

const defaultGoogleMeasurementId = "G-RQHGR4FNF5";

function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || process.env.BKASH_DATABASE_URL?.trim();
}

function encryptionKey() {
  const value = process.env.INTEGRATION_ENCRYPTION_KEY?.trim()
    || process.env.BKASH_ADMIN_REVIEW_TOKEN?.trim()
    || process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN?.trim();
  if (!value || value.length < 32) throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured.");
  return createHash("sha256").update(value).digest();
}

function encrypt(value: IntegrationConfig) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

function decrypt(value: string): IntegrationConfig {
  const packed = Buffer.from(value, "base64url");
  if (packed.length < 28) throw new Error("Stored integration configuration is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), packed.subarray(0, 12));
  decipher.setAuthTag(packed.subarray(12, 28));
  const decoded = Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString("utf8");
  const parsed = JSON.parse(decoded) as IntegrationConfig;
  return parsed && typeof parsed === "object" ? parsed : {};
}

async function client() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not configured.");
  const sql = neon(url);
  await sql.query(tableSql);
  return sql;
}

export async function readStoredIntegrations(): Promise<IntegrationConfig> {
  const sql = await client();
  const rows = await sql`SELECT encrypted_config FROM agentsiraji_integrations WHERE id = 'primary' LIMIT 1`;
  if (!rows[0]?.encrypted_config) return {};
  return decrypt(String(rows[0].encrypted_config));
}

export async function saveStoredIntegrations(value: IntegrationConfig) {
  const sql = await client();
  await sql`
    INSERT INTO agentsiraji_integrations (id, encrypted_config, updated_at)
    VALUES ('primary', ${encrypt(value)}, now())
    ON CONFLICT (id) DO UPDATE SET encrypted_config = EXCLUDED.encrypted_config, updated_at = now()
  `;
}

export function envOrStored(stored: IntegrationConfig, key: keyof IntegrationConfig, envName: string) {
  const storedValue = stored[key];
  const configured = process.env[envName]?.trim() || (typeof storedValue === "string" ? storedValue.trim() : "") || "";
  return configured || (key === "googleMeasurementId" ? defaultGoogleMeasurementId : "");
}

export function redacted(value: string, visible = 4) {
  if (!value) return "";
  if (value.length <= visible * 2) return "•".repeat(Math.max(4, value.length));
  return `${value.slice(0, visible)}••••${value.slice(-visible)}`;
}
