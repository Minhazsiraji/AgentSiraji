import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export type OutreachLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "REPLIED"
  | "AUDIT"
  | "DEMO"
  | "PROPOSAL"
  | "CLOSED"
  | "ARCHIVED";

export type OutreachReplyStatus =
  | "NO_REPLY"
  | "POSITIVE"
  | "MAYBE_LATER"
  | "NOT_INTERESTED"
  | "WRONG_FIT"
  | "DO_NOT_CONTACT";

export type OutreachLead = {
  id: string;
  businessName: string;
  country: string;
  city: string | null;
  platform: string;
  profileUrl: string | null;
  category: string | null;
  sellingMethod: string | null;
  score: number;
  messageVariant: string | null;
  personalizedDm: string | null;
  status: OutreachLeadStatus;
  replyStatus: OutreachReplyStatus;
  firstSentAt: string | null;
  lastTouchAt: string | null;
  nextFollowupAt: string | null;
  followupCount: number;
  demoSent: boolean;
  proposalSent: boolean;
  closed: boolean;
  setupValueUsd: number;
  monthlyValueUsd: number;
  isPartner: boolean;
  notes: string | null;
  createdAt: string;
};

export type OutreachCountryPerformance = {
  country: string;
  leads: number;
  sent: number;
  replies: number;
  replyRate: number;
  demos: number;
  proposals: number;
  closed: number;
  setupRevenueUsd: number;
  monthlyRevenueUsd: number;
};

export type OutreachDashboard = {
  leads: OutreachLead[];
  countries: OutreachCountryPerformance[];
  summary: {
    totalLeads: number;
    sent: number;
    replies: number;
    positiveReplies: number;
    demos: number;
    proposals: number;
    closed: number;
    followupsDue: number;
    setupRevenueUsd: number;
    monthlyRevenueUsd: number;
  };
};

function asIso(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function ensureOutreachTables() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_leads (
      id uuid PRIMARY KEY,
      business_name text NOT NULL,
      country text NOT NULL,
      city text,
      platform text NOT NULL,
      profile_url text,
      category text,
      selling_method text,
      score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
      message_variant text,
      personalized_dm text,
      status text NOT NULL DEFAULT 'NEW',
      reply_status text NOT NULL DEFAULT 'NO_REPLY',
      first_sent_at timestamptz,
      last_touch_at timestamptz,
      next_followup_at timestamptz,
      followup_count integer NOT NULL DEFAULT 0,
      demo_sent boolean NOT NULL DEFAULT false,
      proposal_sent boolean NOT NULL DEFAULT false,
      closed boolean NOT NULL DEFAULT false,
      setup_value_usd numeric(12,2) NOT NULL DEFAULT 0,
      monthly_value_usd numeric(12,2) NOT NULL DEFAULT 0,
      is_partner boolean NOT NULL DEFAULT false,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS outreach_leads_country_idx ON outreach_leads (country)`;
  await sql`CREATE INDEX IF NOT EXISTS outreach_leads_followup_idx ON outreach_leads (next_followup_at) WHERE closed = false`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS outreach_leads_profile_url_unique ON outreach_leads (profile_url) WHERE profile_url IS NOT NULL`;
}

function mapLead(row: Record<string, unknown>): OutreachLead {
  return {
    id: String(row.id),
    businessName: String(row.business_name),
    country: String(row.country),
    city: row.city ? String(row.city) : null,
    platform: String(row.platform),
    profileUrl: row.profile_url ? String(row.profile_url) : null,
    category: row.category ? String(row.category) : null,
    sellingMethod: row.selling_method ? String(row.selling_method) : null,
    score: Number(row.score),
    messageVariant: row.message_variant ? String(row.message_variant) : null,
    personalizedDm: row.personalized_dm ? String(row.personalized_dm) : null,
    status: String(row.status) as OutreachLeadStatus,
    replyStatus: String(row.reply_status) as OutreachReplyStatus,
    firstSentAt: asIso(row.first_sent_at),
    lastTouchAt: asIso(row.last_touch_at),
    nextFollowupAt: asIso(row.next_followup_at),
    followupCount: Number(row.followup_count),
    demoSent: Boolean(row.demo_sent),
    proposalSent: Boolean(row.proposal_sent),
    closed: Boolean(row.closed),
    setupValueUsd: Number(row.setup_value_usd),
    monthlyValueUsd: Number(row.monthly_value_usd),
    isPartner: Boolean(row.is_partner),
    notes: row.notes ? String(row.notes) : null,
    createdAt: asIso(row.created_at) ?? new Date(0).toISOString(),
  };
}

export async function createOutreachLead(input: {
  businessName: string;
  country: string;
  city?: string | null;
  platform: string;
  profileUrl?: string | null;
  category?: string | null;
  sellingMethod?: string | null;
  score: number;
  messageVariant?: string | null;
  personalizedDm?: string | null;
  notes?: string | null;
  isPartner?: boolean;
}) {
  await ensureOutreachTables();
  const sql = db();
  const id = randomUUID();
  const rows = await sql`
    INSERT INTO outreach_leads (
      id, business_name, country, city, platform, profile_url, category,
      selling_method, score, message_variant, personalized_dm, notes, is_partner
    ) VALUES (
      ${id}, ${input.businessName.trim()}, ${input.country.trim()}, ${input.city?.trim() || null},
      ${input.platform.trim()}, ${input.profileUrl?.trim() || null}, ${input.category?.trim() || null},
      ${input.sellingMethod?.trim() || null}, ${input.score}, ${input.messageVariant?.trim() || null},
      ${input.personalizedDm?.trim() || null}, ${input.notes?.trim() || null}, ${Boolean(input.isPartner)}
    )
    RETURNING *
  `;
  return mapLead(rows[0] as Record<string, unknown>);
}

export async function applyOutreachAction(input: {
  id: string;
  action:
    | "MARK_SENT"
    | "FOLLOW_UP"
    | "POSITIVE_REPLY"
    | "MAYBE_LATER"
    | "NOT_INTERESTED"
    | "DO_NOT_CONTACT"
    | "AUDIT_SENT"
    | "DEMO_SENT"
    | "PROPOSAL_SENT"
    | "CLOSED_WON";
  setupValueUsd?: number;
  monthlyValueUsd?: number;
}) {
  await ensureOutreachTables();
  const sql = db();

  if (input.action === "MARK_SENT") {
    const rows = await sql`
      UPDATE outreach_leads SET
        status = 'CONTACTED',
        first_sent_at = COALESCE(first_sent_at, now()),
        last_touch_at = now(),
        next_followup_at = now() + interval '3 days',
        reply_status = 'NO_REPLY',
        updated_at = now()
      WHERE id = ${input.id} AND closed = false
      RETURNING *
    `;
    if (!rows[0]) throw new Error("Lead was not found or is already closed.");
    return mapLead(rows[0] as Record<string, unknown>);
  }

  if (input.action === "FOLLOW_UP") {
    const rows = await sql`
      UPDATE outreach_leads SET
        last_touch_at = now(),
        followup_count = followup_count + 1,
        next_followup_at = CASE WHEN followup_count = 0 THEN now() + interval '4 days' ELSE NULL END,
        updated_at = now()
      WHERE id = ${input.id} AND closed = false AND reply_status = 'NO_REPLY' AND followup_count < 2
      RETURNING *
    `;
    if (!rows[0]) throw new Error("This lead is not eligible for another follow-up.");
    return mapLead(rows[0] as Record<string, unknown>);
  }

  if (input.action === "POSITIVE_REPLY" || input.action === "MAYBE_LATER") {
    const reply = input.action === "POSITIVE_REPLY" ? "POSITIVE" : "MAYBE_LATER";
    const rows = await sql`
      UPDATE outreach_leads SET
        status = 'REPLIED', reply_status = ${reply}, last_touch_at = now(), next_followup_at = NULL, updated_at = now()
      WHERE id = ${input.id} AND closed = false
      RETURNING *
    `;
    if (!rows[0]) throw new Error("Lead was not found or is already closed.");
    return mapLead(rows[0] as Record<string, unknown>);
  }

  if (input.action === "NOT_INTERESTED" || input.action === "DO_NOT_CONTACT") {
    const reply = input.action === "NOT_INTERESTED" ? "NOT_INTERESTED" : "DO_NOT_CONTACT";
    const rows = await sql`
      UPDATE outreach_leads SET
        status = 'ARCHIVED', reply_status = ${reply}, closed = true, last_touch_at = now(), next_followup_at = NULL, updated_at = now()
      WHERE id = ${input.id}
      RETURNING *
    `;
    if (!rows[0]) throw new Error("Lead was not found.");
    return mapLead(rows[0] as Record<string, unknown>);
  }

  const stageMap = {
    AUDIT_SENT: "AUDIT",
    DEMO_SENT: "DEMO",
    PROPOSAL_SENT: "PROPOSAL",
    CLOSED_WON: "CLOSED",
  } as const;
  const status = stageMap[input.action as keyof typeof stageMap];
  if (!status) throw new Error("Unsupported outreach action.");

  const isDemo = input.action === "DEMO_SENT";
  const isProposal = input.action === "PROPOSAL_SENT";
  const isClosed = input.action === "CLOSED_WON";
  const rows = await sql`
    UPDATE outreach_leads SET
      status = ${status},
      demo_sent = CASE WHEN ${isDemo} THEN true ELSE demo_sent END,
      proposal_sent = CASE WHEN ${isProposal} THEN true ELSE proposal_sent END,
      closed = CASE WHEN ${isClosed} THEN true ELSE closed END,
      setup_value_usd = CASE WHEN ${isClosed} THEN ${input.setupValueUsd ?? 0} ELSE setup_value_usd END,
      monthly_value_usd = CASE WHEN ${isClosed} THEN ${input.monthlyValueUsd ?? 0} ELSE monthly_value_usd END,
      last_touch_at = now(),
      next_followup_at = NULL,
      updated_at = now()
    WHERE id = ${input.id}
    RETURNING *
  `;
  if (!rows[0]) throw new Error("Lead was not found.");
  return mapLead(rows[0] as Record<string, unknown>);
}

export async function getOutreachDashboard(): Promise<OutreachDashboard> {
  await ensureOutreachTables();
  const sql = db();
  const [leadRows, summaryRows, countryRows] = await Promise.all([
    sql`
      SELECT * FROM outreach_leads
      ORDER BY
        CASE WHEN next_followup_at IS NOT NULL AND next_followup_at <= now() AND closed = false THEN 0 ELSE 1 END,
        score DESC, created_at DESC
      LIMIT 250
    `,
    sql`
      SELECT
        count(*)::int AS total_leads,
        count(*) FILTER (WHERE first_sent_at IS NOT NULL)::int AS sent,
        count(*) FILTER (WHERE reply_status <> 'NO_REPLY')::int AS replies,
        count(*) FILTER (WHERE reply_status = 'POSITIVE')::int AS positive_replies,
        count(*) FILTER (WHERE demo_sent)::int AS demos,
        count(*) FILTER (WHERE proposal_sent)::int AS proposals,
        count(*) FILTER (WHERE status = 'CLOSED')::int AS closed,
        count(*) FILTER (WHERE next_followup_at IS NOT NULL AND next_followup_at <= now() AND closed = false)::int AS followups_due,
        coalesce(sum(setup_value_usd) FILTER (WHERE status = 'CLOSED'), 0)::numeric AS setup_revenue_usd,
        coalesce(sum(monthly_value_usd) FILTER (WHERE status = 'CLOSED'), 0)::numeric AS monthly_revenue_usd
      FROM outreach_leads
    `,
    sql`
      SELECT
        country,
        count(*)::int AS leads,
        count(*) FILTER (WHERE first_sent_at IS NOT NULL)::int AS sent,
        count(*) FILTER (WHERE reply_status <> 'NO_REPLY')::int AS replies,
        count(*) FILTER (WHERE demo_sent)::int AS demos,
        count(*) FILTER (WHERE proposal_sent)::int AS proposals,
        count(*) FILTER (WHERE status = 'CLOSED')::int AS closed,
        coalesce(sum(setup_value_usd) FILTER (WHERE status = 'CLOSED'), 0)::numeric AS setup_revenue_usd,
        coalesce(sum(monthly_value_usd) FILTER (WHERE status = 'CLOSED'), 0)::numeric AS monthly_revenue_usd
      FROM outreach_leads
      GROUP BY country
      ORDER BY closed DESC, replies DESC, sent DESC, country ASC
    `,
  ]);

  const summary = summaryRows[0] as Record<string, unknown>;
  return {
    leads: leadRows.map((row) => mapLead(row as Record<string, unknown>)),
    summary: {
      totalLeads: Number(summary.total_leads),
      sent: Number(summary.sent),
      replies: Number(summary.replies),
      positiveReplies: Number(summary.positive_replies),
      demos: Number(summary.demos),
      proposals: Number(summary.proposals),
      closed: Number(summary.closed),
      followupsDue: Number(summary.followups_due),
      setupRevenueUsd: Number(summary.setup_revenue_usd),
      monthlyRevenueUsd: Number(summary.monthly_revenue_usd),
    },
    countries: countryRows.map((row) => {
      const sent = Number(row.sent);
      const replies = Number(row.replies);
      return {
        country: String(row.country),
        leads: Number(row.leads),
        sent,
        replies,
        replyRate: sent > 0 ? replies / sent : 0,
        demos: Number(row.demos),
        proposals: Number(row.proposals),
        closed: Number(row.closed),
        setupRevenueUsd: Number(row.setup_revenue_usd),
        monthlyRevenueUsd: Number(row.monthly_revenue_usd),
      };
    }),
  };
}
