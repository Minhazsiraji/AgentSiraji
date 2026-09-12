const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('lead migration defines durable sales funnel states', () => {
  const sql = read('database/0005_sales_leads.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS sales_leads/i);
  for (const status of ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']) {
    assert.match(sql, new RegExp(status));
  }
  assert.match(sql, /utm_source/i);
  assert.match(sql, /payment_reference/i);
});

test('Store Audit persists a lead before owner notification', () => {
  const route = read('app/api/store-audit/route.ts');
  assert.match(route, /createSalesLead/);
  assert.match(route, /leadType:\s*"STORE_AUDIT"/);
  assert.ok(route.indexOf('createSalesLead') < route.lastIndexOf('notifyLead'));
  assert.match(route, /leadId:\s*lead\.id/);
});

test('Contact form persists enquiries even when email delivery is unavailable', () => {
  const route = read('app/api/contact/route.ts');
  assert.match(route, /createSalesLead/);
  assert.match(route, /leadType:\s*"CONTACT"/);
  assert.match(route, /notificationDelivered:\s*false/);
});

test('public acquisition CTAs prefer Store Audit over checkout', () => {
  const files = ['app/page.tsx', 'app/products/commerce/page.tsx', 'app/pricing/page.tsx', 'components/SiteChrome.tsx'];
  for (const file of files) assert.match(read(file), /\/store-audit/);
  assert.doesNotMatch(read('app/products/commerce/page.tsx'), /\/checkout\/commerce/);
  assert.doesNotMatch(read('app/pricing/page.tsx'), /\/checkout\/commerce/);
});

test('lead admin API is token protected and supports funnel/payment states', () => {
  const route = read('app/api/admin/leads/route.ts');
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /x-agentsiraji-admin-token/);
  assert.match(route, /listSalesLeads/);
  assert.match(route, /updateSalesLead/);
  for (const status of ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED']) assert.match(route, new RegExp(status));
});

test('Store Audit emits a saved-lead signal and consent layer maps it to Meta Lead', () => {
  const form = read('components/StoreAuditForm.tsx');
  const tracking = read('components/MetaTracking.tsx');
  assert.match(form, /agentsiraji:lead-saved/);
  assert.match(tracking, /agentsiraji:lead-saved/);
  assert.match(tracking, /trackMetaEvent\("Lead"/);
  assert.match(tracking, /consent !== "granted"/);
});

test('public Meta relay continues to reject fabricated conversion events', () => {
  const route = read('app/api/meta/events/route.ts');
  assert.match(route, /clientEvents = new Set<MetaEventName>\(\["PageView", "ViewContent"\]\)/);
  assert.match(route, /consentGranted !== true/);
});
