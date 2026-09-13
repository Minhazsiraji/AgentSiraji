const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('admin analytics API is platform-session protected and no-store', () => {
  const route = read('app/api/admin/analytics/route.ts');
  assert.match(route, /platformAdminSession/);
  assert.doesNotMatch(route, /x-agentsiraji-admin-token/);
  assert.match(route, /Unauthorized analytics access/);
  assert.match(route, /no-store/);
});

test('analytics query layer is aggregate-only and read-only', () => {
  const analytics = read('lib/sales-analytics.ts');
  assert.match(analytics, /COUNT\(\*\)/i);
  assert.match(analytics, /SUM\(payment_verified_amount\)/i);
  assert.match(analytics, /utm_source/i);
  assert.match(analytics, /utm_campaign/i);
  assert.match(analytics, /generate_series/i);
  assert.doesNotMatch(analytics, /\bINSERT\b/i);
  assert.doesNotMatch(analytics, /\bUPDATE\b/i);
  assert.doesNotMatch(analytics, /\bDELETE\b/i);
  for (const pii of ['email', 'phone', 'contact_name', 'business_name', 'store_url', 'payment_reference', 'payment_sender_hint', 'owner_note']) {
    assert.doesNotMatch(analytics, new RegExp(`\\b${pii}\\b`, 'i'));
  }
});

test('admin analytics page is excluded from indexing', () => {
  const page = read('app/admin/analytics/page.tsx');
  assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(page, /Customer contact data is intentionally excluded/);
});

test('dashboard exposes funnel, attribution, payment and trend metrics without a reusable token field', () => {
  const dashboard = read('components/AdminAnalyticsDashboard.tsx');
  assert.match(dashboard, /\/api\/admin\/analytics/);
  assert.match(dashboard, /Authenticated owner access/);
  assert.doesNotMatch(dashboard, /x-agentsiraji-admin-token/);
  assert.match(dashboard, /Total leads/);
  assert.match(dashboard, /Qualified\+/);
  assert.match(dashboard, /Verified revenue/);
  assert.match(dashboard, /Pending payment/);
  assert.match(dashboard, /Top sources/);
  assert.match(dashboard, /Top campaigns/);
  assert.match(dashboard, /14-day lead trend/);
  assert.match(dashboard, /Read-only · no customer PII/);
});

test('owner operations links to analytics without changing public navigation', () => {
  const admin = read('app/admin/page.tsx');
  assert.match(admin, /href="\/admin\/analytics"/);
  const chrome = read('components/SiteChrome.tsx');
  assert.doesNotMatch(chrome, /\/admin\/analytics/);
});
