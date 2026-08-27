import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  applyOutreachAction,
  createOutreachLead,
  getOutreachDashboard,
} from "@/lib/outreach-db";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxBodyBytes = 32_768;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

function authorized(request: Request) {
  const expected = process.env.OUTREACH_ADMIN_TOKEN || process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN;
  const supplied = request.headers.get("x-agentsiraji-admin-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  return text.length <= max ? text : "";
}

async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new Error("UNSUPPORTED_MEDIA_TYPE");
  }
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) {
    throw new Error("TOO_LARGE");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBodyBytes) throw new Error("TOO_LARGE");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized outreach access." }, 401);
  try {
    return json({ ok: true, ...(await getOutreachDashboard()) });
  } catch (error) {
    console.error("Foreign outreach dashboard failed", error);
    return json({ error: "Outreach data could not be loaded." }, 500);
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized outreach access." }, 401);

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Request origin is not allowed." }, 403);
  }

  try {
    const body = await readBody(request);
    const type = String(body.type ?? "");

    if (type === "CREATE_LEAD") {
      const businessName = cleanText(body.businessName, 160);
      const country = cleanText(body.country, 80);
      const city = cleanText(body.city, 80);
      const platform = cleanText(body.platform, 40);
      const profileUrl = cleanText(body.profileUrl, 500);
      const category = cleanText(body.category, 120);
      const sellingMethod = cleanText(body.sellingMethod, 160);
      const messageVariant = cleanText(body.messageVariant, 80);
      const personalizedDm = cleanText(body.personalizedDm, 2_500);
      const notes = cleanText(body.notes, 2_000);
      const score = Number(body.score);

      if (!businessName || !country || !platform || !Number.isInteger(score) || score < 0 || score > 100) {
        return json({ error: "Business, country, platform, and a 0–100 score are required." }, 400);
      }
      if (profileUrl && !validHttpUrl(profileUrl)) {
        return json({ error: "Profile URL must be a valid http(s) URL." }, 400);
      }

      const lead = await createOutreachLead({
        businessName,
        country,
        city: city || null,
        platform,
        profileUrl: profileUrl || null,
        category: category || null,
        sellingMethod: sellingMethod || null,
        score,
        messageVariant: messageVariant || null,
        personalizedDm: personalizedDm || null,
        notes: notes || null,
        isPartner: body.isPartner === true,
      });
      return json({ ok: true, lead }, 201);
    }

    if (type === "ACTION") {
      const id = cleanText(body.id, 64);
      const action = String(body.action ?? "");
      const allowedActions = [
        "MARK_SENT",
        "FOLLOW_UP",
        "POSITIVE_REPLY",
        "MAYBE_LATER",
        "NOT_INTERESTED",
        "DO_NOT_CONTACT",
        "AUDIT_SENT",
        "DEMO_SENT",
        "PROPOSAL_SENT",
        "CLOSED_WON",
      ] as const;
      if (!uuidPattern.test(id) || !allowedActions.includes(action as (typeof allowedActions)[number])) {
        return json({ error: "A valid lead and action are required." }, 400);
      }

      const setupValueUsd = Number(body.setupValueUsd ?? 0);
      const monthlyValueUsd = Number(body.monthlyValueUsd ?? 0);
      if (
        !Number.isFinite(setupValueUsd) || setupValueUsd < 0 || setupValueUsd > 1_000_000 ||
        !Number.isFinite(monthlyValueUsd) || monthlyValueUsd < 0 || monthlyValueUsd > 1_000_000
      ) {
        return json({ error: "Revenue values are invalid." }, 400);
      }

      const lead = await applyOutreachAction({
        id,
        action: action as Parameters<typeof applyOutreachAction>[0]["action"],
        setupValueUsd,
        monthlyValueUsd,
      });
      return json({ ok: true, lead });
    }

    return json({ error: "Unsupported outreach operation." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNSUPPORTED_MEDIA_TYPE") return json({ error: "Content-Type must be application/json." }, 415);
    if (message === "TOO_LARGE") return json({ error: "Request is too large." }, 413);
    if (message === "INVALID_JSON") return json({ error: "Invalid JSON payload." }, 400);
    if (message.includes("duplicate key")) return json({ error: "That public profile URL is already in the outreach database." }, 409);
    console.error("Foreign outreach operation failed", error);
    return json({ error: message || "Outreach operation could not be completed." }, 409);
  }
}
