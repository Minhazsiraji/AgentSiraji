const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const loader = require('./load-ts.cjs');

const originalEnv = { ...process.env };

test('LeadPilot delivery uses server-side bearer auth and never puts the key in the URL', async () => {
  const previousFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options, body: JSON.parse(options.body) });
    return Response.json({ ok: true, duplicate: false, leadId: 77 }, { status: 201 });
  };
  try {
    const config = { leadPilotUrl: 'https://leadpilot.example/api/integrations/website-leads', leadPilotIngestKey: 'stage9-secret-key', leadPilotConfirmed: true };
    const { deliverLeadToLeadPilot } = loader({
      '@/lib/integration-config': {
        readStoredIntegrations: async () => config,
        envOrStored: (stored, key) => stored[key] || '',
      },
    })('lib/leadpilot.ts');
    const result = await deliverLeadToLeadPilot({
      customerName: 'Demo Store', email: 'owner@example.com', phone: '01700000000',
      service: 'AgentSiraji Free Store Audit', location: 'Bangladesh', message: 'Saved first in AgentSiraji.',
      pageUrl: 'https://agentsiraji.com/store-audit', sourceName: 'AgentSiraji Store Audit',
    });
    assert.equal(result.delivered, true);
    assert.equal(result.leadId, '77');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, config.leadPilotUrl);
    assert.equal(calls[0].url.includes('stage9-secret-key'), false);
    assert.equal(calls[0].options.headers.authorization, 'Bearer stage9-secret-key');
    assert.equal(calls[0].body.customerName, 'Demo Store');
    assert.equal(Object.hasOwn(calls[0].options.headers, 'origin'), false);
  } finally { global.fetch = previousFetch; process.env = { ...originalEnv }; }
});

test('LeadPilot health authenticates with a validation-only POST that creates no lead', async () => {
  const previousFetch = global.fetch;
  let requestBody;
  global.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return Response.json({ error: 'Enter the customer name.' }, { status: 400 });
  };
  try {
    const config = { leadPilotUrl: 'https://leadpilot.example/api/integrations/website-leads', leadPilotIngestKey: 'stage9-secret-key', leadPilotConfirmed: true };
    const { probeLeadPilotConnection } = loader({
      '@/lib/integration-config': {
        readStoredIntegrations: async () => config,
        envOrStored: (stored, key) => stored[key] || '',
      },
    })('lib/leadpilot.ts');
    const result = await probeLeadPilotConnection(config);
    assert.equal(result.state, 'healthy');
    assert.deepEqual(requestBody, {});
    assert.match(result.detail, /stopped before creating a lead/i);
  } finally { global.fetch = previousFetch; process.env = { ...originalEnv }; }
});

test('LeadPilot invalid ingest key is a health error', async () => {
  const previousFetch = global.fetch;
  global.fetch = async () => Response.json({ error: 'Invalid website integration key.' }, { status: 401 });
  try {
    const config = { leadPilotUrl: 'https://leadpilot.example/api/integrations/website-leads', leadPilotIngestKey: 'wrong-key', leadPilotConfirmed: true };
    const { probeLeadPilotConnection } = loader({
      '@/lib/integration-config': { readStoredIntegrations: async () => config, envOrStored: (stored, key) => stored[key] || '' },
    })('lib/leadpilot.ts');
    const result = await probeLeadPilotConnection(config);
    assert.equal(result.state, 'error');
    assert.equal(result.status, 401);
  } finally { global.fetch = previousFetch; process.env = { ...originalEnv }; }
});

test('Store Audit remains successful when a configured LeadPilot mirror fails', async () => {
  const recorded = [];
  const load = loader({
    '@/lib/attribution': { attributionFromRequest: () => ({ utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null, referrer: null, landingPath: '/store-audit' }) },
    '@/lib/leadpilot': { deliverLeadToLeadPilot: async () => ({ configured: true, delivered: false, status: 503 }) },
    '@/lib/meta': { isMetaEventId: () => false, sendMetaEvent: async () => ({ sent: false }) },
    '@/lib/sales-leads': {
      createSalesLead: async () => ({ id: '91', status: 'NEW', createdAt: new Date().toISOString() }),
      recordSalesLeadEvent: async (leadId, eventType, note) => recorded.push({ leadId, eventType, note }),
    },
    '@/lib/store-audit-scanner': { scanStore: async () => { throw new Error('scanner unavailable'); } },
  });
  const previousResend = process.env.RESEND_API_KEY;
  const previousTo = process.env.CONTACT_TO_EMAIL;
  delete process.env.RESEND_API_KEY; delete process.env.CONTACT_TO_EMAIL;
  try {
    const { POST } = load('app/api/store-audit/route.ts');
    const response = await POST(new Request('https://agentsiraji.com/api/store-audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://agentsiraji.com', 'x-forwarded-for': '203.0.113.91' },
      body: JSON.stringify({ businessName: 'Demo Store', country: 'Bangladesh', storeUrl: 'https://example.com', email: 'owner@example.com', whatsapp: '01700000000', productCount: '1–20' }),
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).leadId, '91');
    assert.equal(recorded[0].eventType, 'LEADPILOT_FAILED');
  } finally {
    if (previousResend === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousResend;
    if (previousTo === undefined) delete process.env.CONTACT_TO_EMAIL; else process.env.CONTACT_TO_EMAIL = previousTo;
  }
});

test('Stage 9 browser diagnostics are observational and do not trigger conversions', () => {
  const ui = fs.readFileSync('components/IntegrationSettings.tsx', 'utf8');
  assert.match(ui, /Run browser delivery checks/);
  assert.match(ui, /performance\.getEntriesByType\("resource"\)/);
  assert.match(ui, /marketingConsentKey/);
  assert.match(ui, /does not generate a test conversion/i);
  assert.doesNotMatch(ui, /trackMetaEvent\(/);
  assert.doesNotMatch(ui, /trackGoogleEvent\(/);
  assert.doesNotMatch(ui, /trackGoogleLead\(/);
});

test('real lead routes mirror only after authoritative AgentSiraji persistence and audit the result', () => {
  for (const file of ['app/api/store-audit/route.ts', 'app/api/contact/route.ts']) {
    const source = fs.readFileSync(file, 'utf8');
    const savedAt = source.lastIndexOf('await createSalesLead');
    const mirroredAt = source.lastIndexOf('deliverLeadToLeadPilot');
    assert.ok(savedAt >= 0 && mirroredAt > savedAt, `${file} must persist before mirroring`);
    assert.match(source, /LEADPILOT_DELIVERED/);
    assert.match(source, /LEADPILOT_FAILED/);
    assert.match(source, /recordSalesLeadEvent/);
  }
});
