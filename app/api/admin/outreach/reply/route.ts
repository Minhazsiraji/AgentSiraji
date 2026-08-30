import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeOutreachReply } from "@/lib/outreach-reply-assistant";

const maxBodyBytes = 12_000;
const maxReplyChars = 2_500;

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

async function ensureConversationTable() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_messages (
      id uuid PRIMARY KEY,
      lead_id uuid NOT NULL REFERENCES outreach_leads(id) ON DELETE CASCADE,
      direction text NOT NULL CHECK (direction IN ('INBOUND', 'SUGGESTED', 'OUTBOUND')),
      body text NOT NULL,
      intent text,
      recommended_product text,
      next_action text,
      confidence numeric(4,3),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS outreach_messages_lead_created_idx ON outreach_messages (lead_id, created_at DESC)`;
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  return text.length <= max ? text : "";
}

async function getLead(profileUrl: string) {
  const sql = db();
  const rows = await sql`
    SELECT id, business_name, country, is_partner, closed, status, reply_status
    FROM outreach_leads
    WHERE profile_url = ${profileUrl}
    LIMIT 1
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

async function getHistory(leadId: string) {
  const sql = db();
  const rows = await sql`
    SELECT id, direction, body, intent, recommended_product, next_action, confidence, created_at
    FROM (
      SELECT id, direction, body, intent, recommended_product, next_action, confidence, created_at
      FROM outreach_messages
      WHERE lead_id = ${leadId}
      ORDER BY created_at DESC
      LIMIT 20
    ) recent
    ORDER BY created_at ASC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    direction: String(row.direction),
    body: String(row.body),
    intent: row.intent ? String(row.intent) : null,
    recommendedProduct: row.recommended_product ? String(row.recommended_product) : null,
    nextAction: row.next_action ? String(row.next_action) : null,
    confidence: row.confidence === null || row.confidence === undefined ? null : Number(row.confidence),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized outreach access." }, 401);
  const profileUrl = cleanText(new URL(request.url).searchParams.get("profileUrl"), 500);
  if (!profileUrl) return json({ error: "Official contact URL is required." }, 400);

  try {
    await ensureConversationTable();
    const lead = await getLead(profileUrl);
    if (!lead) return json({ error: "Lead was not found." }, 404);
    return json({ ok: true, history: await getHistory(String(lead.id)) });
  } catch (error) {
    console.error("Outreach reply history failed", error);
    return json({ error: "Reply history could not be loaded." }, 500);
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized outreach access." }, 401);

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Request origin is not allowed." }, 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Content-Type must be application/json." }, 415);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBodyBytes) {
    return json({ error: "Request is too large." }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON payload." }, 400);
  }

  const type = cleanText(body.type, 40);
  const profileUrl = cleanText(body.profileUrl, 500);
  if (!profileUrl) return json({ error: "Official contact URL is required." }, 400);

  try {
    await ensureConversationTable();
    const lead = await getLead(profileUrl);
    if (!lead) return json({ error: "Lead was not found." }, 404);
    if (Boolean(lead.closed) && type === "ANALYZE") {
      return json({ error: "This lead is already archived or closed." }, 409);
    }

    const sql = db();
    const leadId = String(lead.id);

    if (type === "ANALYZE") {
      const clientReply = cleanText(body.clientReply, maxReplyChars);
      if (!clientReply) return json({ error: "Paste the client reply first." }, 400);

      const analysis = analyzeOutreachReply({
        message: clientReply,
        businessName: String(lead.business_name),
        country: String(lead.country),
        isPartner: Boolean(lead.is_partner),
      });

      const inboundId = randomUUID();
      const suggestionId = randomUUID();
      await sql.transaction([
        sql`
          INSERT INTO outreach_messages (id, lead_id, direction, body, intent, recommended_product, next_action, confidence)
          VALUES (${inboundId}, ${leadId}, 'INBOUND', ${clientReply}, ${analysis.intent}, ${analysis.recommendedProduct}, ${analysis.nextAction}, ${analysis.confidence})
        `,
        sql`
          INSERT INTO outreach_messages (id, lead_id, direction, body, intent, recommended_product, next_action, confidence)
          VALUES (${suggestionId}, ${leadId}, 'SUGGESTED', ${analysis.suggestedReply}, ${analysis.intent}, ${analysis.recommendedProduct}, ${analysis.nextAction}, ${analysis.confidence})
        `,
        analysis.replyStatus === "DO_NOT_CONTACT" || analysis.replyStatus === "NOT_INTERESTED"
          ? sql`
              UPDATE outreach_leads SET
                status = 'ARCHIVED', reply_status = ${analysis.replyStatus}, closed = true,
                last_touch_at = now(), next_followup_at = NULL, updated_at = now()
              WHERE id = ${leadId}
            `
          : analysis.replyStatus === "MAYBE_LATER"
            ? sql`
                UPDATE outreach_leads SET
                  status = 'REPLIED', reply_status = 'MAYBE_LATER', closed = false,
                  last_touch_at = now(), next_followup_at = now() + interval '30 days', updated_at = now()
                WHERE id = ${leadId}
              `
            : sql`
                UPDATE outreach_leads SET
                  status = 'REPLIED', reply_status = 'POSITIVE', closed = false,
                  last_touch_at = now(), next_followup_at = NULL, updated_at = now()
                WHERE id = ${leadId}
              `,
      ]);

      return json({
        ok: true,
        suggestionId,
        analysis,
        history: await getHistory(leadId),
      });
    }

    if (type === "MARK_REPLY_SENT") {
      const reply = cleanText(body.reply, maxReplyChars);
      const intent = cleanText(body.intent, 60);
      const recommendedProduct = cleanText(body.recommendedProduct, 40);
      const nextAction = cleanText(body.nextAction, 40);
      if (!reply) return json({ error: "Reply text is required." }, 400);

      const allowedProducts = ["COMMERCE", "LEADPILOT", "ADINTEL", "DISCOVERY", "PARTNER", "NONE"];
      const allowedActions = ["QUALIFY", "DEMO", "FOLLOW_UP", "CLOSE", "MEETING", "DISCOVERY", "PARTNER"];
      if (recommendedProduct && !allowedProducts.includes(recommendedProduct)) return json({ error: "Invalid product route." }, 400);
      if (nextAction && !allowedActions.includes(nextAction)) return json({ error: "Invalid next action." }, 400);

      await sql.transaction([
        sql`
          INSERT INTO outreach_messages (id, lead_id, direction, body, intent, recommended_product, next_action)
          VALUES (${randomUUID()}, ${leadId}, 'OUTBOUND', ${reply}, ${intent || null}, ${recommendedProduct || null}, ${nextAction || null})
        `,
        nextAction === "DEMO"
          ? sql`
              UPDATE outreach_leads SET demo_sent = true, status = 'DEMO', last_touch_at = now(), updated_at = now()
              WHERE id = ${leadId} AND closed = false
            `
          : sql`
              UPDATE outreach_leads SET last_touch_at = now(), updated_at = now()
              WHERE id = ${leadId}
            `,
      ]);

      return json({ ok: true, history: await getHistory(leadId) });
    }

    return json({ error: "Unsupported reply-assistant operation." }, 400);
  } catch (error) {
    console.error("Outreach reply assistant failed", error);
    return json({ error: "Reply assistant could not complete the operation." }, 500);
  }
}
