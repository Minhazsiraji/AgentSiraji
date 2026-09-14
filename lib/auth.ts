import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

const MAGIC_LINK_TTL_MINUTES = 15;
const SESSION_TTL_DAYS = 7;
export const authSessionCookie = process.env.VERCEL_ENV === "production"
  ? "__Host-agentsiraji_session"
  : "agentsiraji_session";

export type AuthSession = {
  accountId: string;
  email: string;
  displayName: string | null;
  accountStatus: string;
  platformRoles: string[];
  memberships: Array<{ organizationId: string; role: string }>;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function safeRedirectPath(value: string | null | undefined, fallback = "/account/commerce") {
  const candidate = (value || "").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  try {
    const parsed = new URL(candidate, "https://agentsiraji.com");
    if (parsed.origin !== "https://agentsiraji.com") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`.slice(0, 500);
  } catch {
    return fallback;
  }
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function authCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.VERCEL_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createMagicLink(emailInput: string, redirectInput?: string, requestedIp?: string | null) {
  const email = normalizeEmail(emailInput);
  const sql = db();
  const accounts = await sql`
    SELECT id, email, status
    FROM accounts
    WHERE lower(email) = ${email}
      AND status IN ('PENDING', 'ACTIVE')
    LIMIT 1
  `;
  const account = accounts[0];
  if (!account) return null;

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const redirectPath = safeRedirectPath(redirectInput);
  const ipHash = requestedIp && process.env.AUTH_IP_HASH_SALT
    ? hashToken(`${process.env.AUTH_IP_HASH_SALT}:${requestedIp}`)
    : null;
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);

  await sql`
    INSERT INTO auth_magic_links (account_id, token_hash, redirect_path, expires_at, requested_ip_hash)
    VALUES (${String(account.id)}, ${tokenHash}, ${redirectPath}, ${expiresAt.toISOString()}, ${ipHash})
  `;
  await sql`
    INSERT INTO auth_security_events (account_id, event_type, detail)
    VALUES (${String(account.id)}, 'MAGIC_LINK_REQUESTED', 'Passwordless sign-in link requested')
  `;

  return { rawToken, email: String(account.email), redirectPath, expiresAt };
}

export async function consumeMagicLink(rawToken: string) {
  if (!/^[A-Za-z0-9_-]{30,200}$/.test(rawToken)) return null;
  const sql = db();
  const rows = await sql`
    UPDATE auth_magic_links
    SET consumed_at = now()
    WHERE token_hash = ${hashToken(rawToken)}
      AND consumed_at IS NULL
      AND expires_at > now()
    RETURNING account_id, redirect_path
  `;
  const link = rows[0];
  if (!link) return null;

  const accountId = String(link.account_id);
  await sql`
    UPDATE accounts
    SET status = CASE WHEN status = 'PENDING' THEN 'ACTIVE' ELSE status END,
        updated_at = now()
    WHERE id = ${accountId}
      AND status IN ('PENDING', 'ACTIVE')
  `;

  const rawSession = randomBytes(32).toString("base64url");
  const sessionHash = hashToken(rawSession);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO auth_sessions (account_id, session_hash, expires_at)
    VALUES (${accountId}, ${sessionHash}, ${expiresAt.toISOString()})
  `;
  await sql`
    INSERT INTO auth_security_events (account_id, event_type, detail)
    VALUES (${accountId}, 'SESSION_CREATED', 'Magic link consumed and session created')
  `;

  return {
    accountId,
    rawSession,
    expiresAt,
    redirectPath: safeRedirectPath(String(link.redirect_path || "")),
  };
}

export async function readSession(request: Request): Promise<AuthSession | null> {
  const rawSession = cookieValue(request, authSessionCookie);
  if (!rawSession || !/^[A-Za-z0-9_-]{30,200}$/.test(rawSession)) return null;
  const sql = db();
  const rows = await sql`
    SELECT a.id, a.email, a.display_name, a.status
    FROM auth_sessions s
    JOIN accounts a ON a.id = s.account_id
    WHERE s.session_hash = ${hashToken(rawSession)}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND a.status = 'ACTIVE'
    LIMIT 1
  `;
  const account = rows[0];
  if (!account) return null;

  const accountId = String(account.id);
  const roles = await sql`
    SELECT role FROM platform_account_roles WHERE account_id = ${accountId} ORDER BY role
  `;
  const memberships = await sql`
    SELECT organization_id, role
    FROM organization_members
    WHERE account_id = ${accountId}
    ORDER BY created_at ASC
  `;

  return {
    accountId,
    email: String(account.email),
    displayName: account.display_name ? String(account.display_name) : null,
    accountStatus: String(account.status),
    platformRoles: roles.map(row => String(row.role)),
    memberships: memberships.map(row => ({ organizationId: String(row.organization_id), role: String(row.role) })),
  };
}

export function isPlatformAdmin(session: AuthSession | null) {
  return Boolean(session?.platformRoles.some(role => role === "PLATFORM_OWNER" || role === "PLATFORM_ADMIN"));
}

export async function revokeCurrentSession(request: Request) {
  const rawSession = cookieValue(request, authSessionCookie);
  if (!rawSession) return;
  const sql = db();
  const rows = await sql`
    UPDATE auth_sessions
    SET revoked_at = now()
    WHERE session_hash = ${hashToken(rawSession)}
      AND revoked_at IS NULL
    RETURNING account_id
  `;
  if (rows[0]) {
    await sql`
      INSERT INTO auth_security_events (account_id, event_type, detail)
      VALUES (${String(rows[0].account_id)}, 'SESSION_REVOKED', 'User signed out')
    `;
  }
}
