"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AnalyticsBreakdown, AnalyticsTrendPoint, SalesAnalytics } from "@/lib/sales-analytics";
import styles from "@/app/admin/analytics/admin-analytics.module.css";

type AnalyticsResponse = {
  ok?: boolean;
  analytics?: SalesAnalytics;
  error?: string;
};

function formatBdt(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

function readableLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Breakdown({ title, items }: { title: string; items: AnalyticsBreakdown[] }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <article className={styles.panel}>
      <div className={styles.panelHeading}>
        <span>{title}</span>
        <strong>{items.reduce((sum, item) => sum + item.count, 0)}</strong>
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>No data yet.</p>
      ) : (
        <div className={styles.breakdownList}>
          {items.map((item) => (
            <div className={styles.breakdownRow} key={`${title}-${item.label}`}>
              <div className={styles.breakdownMeta}>
                <span>{readableLabel(item.label)}</span>
                <strong>{item.count}</strong>
              </div>
              <div className={styles.barTrack} aria-hidden="true">
                <i style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function Trend({ points }: { points: AnalyticsTrendPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.leads));
  return (
    <article className={`${styles.panel} ${styles.trendPanel}`}>
      <div className={styles.panelHeading}>
        <span>14-day lead trend</span>
        <strong>{points.reduce((sum, point) => sum + point.leads, 0)}</strong>
      </div>
      <div className={styles.trendGrid}>
        {points.map((point) => (
          <div className={styles.trendDay} key={point.date} title={`${point.date}: ${point.leads} lead(s)`}>
            <div className={styles.trendBarWrap}>
              <i style={{ height: `${point.leads === 0 ? 3 : Math.max(10, (point.leads / max) * 100)}%` }} />
            </div>
            <span>{point.date.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className={styles.trendFoot}>
        <span>Verified payments: <strong>{points.reduce((sum, point) => sum + point.verifiedPayments, 0)}</strong></span>
        <span>Verified revenue: <strong>{formatBdt(points.reduce((sum, point) => sum + point.verifiedRevenueBdt, 0))}</strong></span>
      </div>
    </article>
  );
}

export function AdminAnalyticsDashboard() {
  const [token, setToken] = useState("");
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generatedLabel = useMemo(() => {
    if (!analytics) return "";
    const date = new Date(analytics.generatedAt);
    return Number.isNaN(date.getTime()) ? analytics.generatedAt : date.toLocaleString();
  }, [analytics]);

  async function load(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/analytics", {
        method: "GET",
        headers: { "x-agentsiraji-admin-token": token.trim() },
        cache: "no-store",
      });
      const data = await response.json() as AnalyticsResponse;
      if (!response.ok || !data.analytics) throw new Error(data.error || "Unable to load analytics.");
      setAnalytics(data.analytics);
    } catch (error) {
      setAnalytics(null);
      setMessage(error instanceof Error ? error.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.dashboard}>
      <form className={styles.accessCard} onSubmit={load}>
        <div>
          <span className={styles.eyebrow}>Owner access</span>
          <h2>Commercial analytics</h2>
          <p>Aggregates only. Customer contact details and transaction evidence are intentionally excluded from this dashboard.</p>
        </div>
        <div className={styles.accessControls}>
          <label>
            Owner admin token
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Enter owner token"
            />
          </label>
          <button className="button button-primary" disabled={loading || token.trim().length < 32}>
            {loading ? "Loading…" : analytics ? "Refresh analytics →" : "Load analytics →"}
          </button>
        </div>
        {message ? <p className={styles.error} role="status">{message}</p> : null}
      </form>

      {analytics ? (
        <>
          <div className={styles.analyticsMeta}>
            <span>Generated {generatedLabel}</span>
            <span>Read-only · no customer PII</span>
          </div>

          <section className={styles.metricGrid} aria-label="Commercial summary">
            <article className={styles.metric}><span>Total leads</span><strong>{analytics.totals.leads}</strong><small>{analytics.totals.leads7d} in last 7 days</small></article>
            <article className={styles.metric}><span>Qualified+</span><strong>{analytics.totals.qualifiedOrBetter}</strong><small>{analytics.totals.qualificationRate}% of leads</small></article>
            <article className={styles.metric}><span>Won</span><strong>{analytics.totals.won}</strong><small>{analytics.totals.wonRate}% conversion</small></article>
            <article className={styles.metric}><span>Verified revenue</span><strong>{formatBdt(analytics.totals.verifiedRevenueBdt)}</strong><small>Owner-verified BDT only</small></article>
            <article className={styles.metric}><span>Pending payment</span><strong>{formatBdt(analytics.totals.pendingPaymentBdt)}</strong><small>Expected amount awaiting verification</small></article>
            <article className={styles.metric}><span>30-day leads</span><strong>{analytics.totals.leads30d}</strong><small>{analytics.totals.lost} currently lost</small></article>
          </section>

          {analytics.totals.leads === 0 ? (
            <div className={styles.zeroState}>
              <strong>No production leads yet.</strong>
              <p>The dashboard is ready. Metrics will populate automatically after the first Store Audit or Contact lead is saved.</p>
            </div>
          ) : null}

          <section className={styles.panelGrid} aria-label="Lead breakdowns">
            <Breakdown title="Funnel status" items={analytics.byStatus} />
            <Breakdown title="Lead type" items={analytics.byLeadType} />
            <Breakdown title="Payment status" items={analytics.byPaymentStatus} />
            <Breakdown title="Top sources" items={analytics.topSources} />
            <Breakdown title="Top campaigns" items={analytics.topCampaigns} />
            <Trend points={analytics.trend14d} />
          </section>
        </>
      ) : null}
    </div>
  );
}
