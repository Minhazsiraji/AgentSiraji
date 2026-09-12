import { db } from "@/lib/db";

export type AnalyticsBreakdown = { label: string; count: number };
export type AnalyticsTrendPoint = {
  date: string;
  leads: number;
  verifiedPayments: number;
  verifiedRevenueBdt: number;
};

export type SalesAnalytics = {
  generatedAt: string;
  totals: {
    leads: number;
    leads7d: number;
    leads30d: number;
    qualifiedOrBetter: number;
    won: number;
    lost: number;
    verifiedRevenueBdt: number;
    pendingPaymentBdt: number;
    wonRate: number;
    qualificationRate: number;
  };
  byStatus: AnalyticsBreakdown[];
  byLeadType: AnalyticsBreakdown[];
  byPaymentStatus: AnalyticsBreakdown[];
  topSources: AnalyticsBreakdown[];
  topCampaigns: AnalyticsBreakdown[];
  trend14d: AnalyticsTrendPoint[];
};

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function getSalesAnalytics(): Promise<SalesAnalytics> {
  const sql = db();

  const summaryRows = await sql`
    SELECT
      COUNT(*)::int AS total_leads,
      COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS leads_7d,
      COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS leads_30d,
      COUNT(*) FILTER (WHERE status IN ('QUALIFIED', 'PROPOSAL', 'WON'))::int AS qualified_or_better,
      COUNT(*) FILTER (WHERE status = 'WON')::int AS won,
      COUNT(*) FILTER (WHERE status = 'LOST')::int AS lost,
      COALESCE(SUM(payment_verified_amount) FILTER (
        WHERE payment_status = 'VERIFIED' AND payment_currency = 'BDT'
      ), 0) AS verified_revenue_bdt,
      COALESCE(SUM(payment_expected_amount) FILTER (
        WHERE payment_status = 'PENDING_VERIFICATION' AND payment_currency = 'BDT'
      ), 0) AS pending_payment_bdt
    FROM sales_leads
  `;

  const statusRows = await sql`
    SELECT status AS label, COUNT(*)::int AS count
    FROM sales_leads
    GROUP BY status
    ORDER BY CASE status
      WHEN 'NEW' THEN 1
      WHEN 'CONTACTED' THEN 2
      WHEN 'QUALIFIED' THEN 3
      WHEN 'PROPOSAL' THEN 4
      WHEN 'WON' THEN 5
      WHEN 'LOST' THEN 6
      ELSE 7
    END
  `;

  const typeRows = await sql`
    SELECT lead_type AS label, COUNT(*)::int AS count
    FROM sales_leads
    GROUP BY lead_type
    ORDER BY count DESC, lead_type ASC
  `;

  const paymentRows = await sql`
    SELECT payment_status AS label, COUNT(*)::int AS count
    FROM sales_leads
    GROUP BY payment_status
    ORDER BY count DESC, payment_status ASC
  `;

  const sourceRows = await sql`
    SELECT COALESCE(NULLIF(BTRIM(utm_source), ''), 'Direct / unknown') AS label, COUNT(*)::int AS count
    FROM sales_leads
    GROUP BY 1
    ORDER BY count DESC, label ASC
    LIMIT 8
  `;

  const campaignRows = await sql`
    SELECT COALESCE(NULLIF(BTRIM(utm_campaign), ''), 'Unattributed') AS label, COUNT(*)::int AS count
    FROM sales_leads
    GROUP BY 1
    ORDER BY count DESC, label ASC
    LIMIT 8
  `;

  const trendRows = await sql`
    WITH days AS (
      SELECT generate_series(current_date - interval '13 days', current_date, interval '1 day')::date AS day
    )
    SELECT
      to_char(days.day, 'YYYY-MM-DD') AS date,
      COUNT(leads.id) FILTER (
        WHERE leads.created_at >= days.day
          AND leads.created_at < days.day + interval '1 day'
      )::int AS leads,
      COUNT(leads.id) FILTER (
        WHERE leads.payment_verified_at >= days.day
          AND leads.payment_verified_at < days.day + interval '1 day'
      )::int AS verified_payments,
      COALESCE(SUM(leads.payment_verified_amount) FILTER (
        WHERE leads.payment_verified_at >= days.day
          AND leads.payment_verified_at < days.day + interval '1 day'
          AND leads.payment_status = 'VERIFIED'
          AND leads.payment_currency = 'BDT'
      ), 0) AS verified_revenue_bdt
    FROM days
    LEFT JOIN sales_leads AS leads
      ON (
        (leads.created_at >= days.day AND leads.created_at < days.day + interval '1 day')
        OR (leads.payment_verified_at >= days.day AND leads.payment_verified_at < days.day + interval '1 day')
      )
    GROUP BY days.day
    ORDER BY days.day ASC
  `;

  const summary = summaryRows[0] ?? {};
  const leads = asNumber(summary.total_leads);
  const qualifiedOrBetter = asNumber(summary.qualified_or_better);
  const won = asNumber(summary.won);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      leads,
      leads7d: asNumber(summary.leads_7d),
      leads30d: asNumber(summary.leads_30d),
      qualifiedOrBetter,
      won,
      lost: asNumber(summary.lost),
      verifiedRevenueBdt: asNumber(summary.verified_revenue_bdt),
      pendingPaymentBdt: asNumber(summary.pending_payment_bdt),
      wonRate: percent(won, leads),
      qualificationRate: percent(qualifiedOrBetter, leads),
    },
    byStatus: statusRows.map((row) => ({ label: String(row.label), count: asNumber(row.count) })),
    byLeadType: typeRows.map((row) => ({ label: String(row.label), count: asNumber(row.count) })),
    byPaymentStatus: paymentRows.map((row) => ({ label: String(row.label), count: asNumber(row.count) })),
    topSources: sourceRows.map((row) => ({ label: String(row.label), count: asNumber(row.count) })),
    topCampaigns: campaignRows.map((row) => ({ label: String(row.label), count: asNumber(row.count) })),
    trend14d: trendRows.map((row) => ({
      date: String(row.date),
      leads: asNumber(row.leads),
      verifiedPayments: asNumber(row.verified_payments),
      verifiedRevenueBdt: asNumber(row.verified_revenue_bdt),
    })),
  };
}
