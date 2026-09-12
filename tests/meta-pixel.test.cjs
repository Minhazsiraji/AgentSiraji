const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const loader = require('./load-ts.cjs');
const originalEnv = { ...process.env };
const request = (body, headers = {}) => new Request('https://agentsiraji.com/api/test', {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
});

test('origin check accepts browser Host when Next normalizes the local request URL', () => {
  const { requestOriginAllowed } = loader()('lib/request-safety.ts');
  const local = new Request('http://localhost:3000/api/test', { headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' } });
  assert.equal(requestOriginAllowed(local), true);
  assert.equal(requestOriginAllowed(new Request(local, { headers: { host: '127.0.0.1:3000', origin: 'https://evil.example' } })), false);
});

test('CAPI uses numeric pixel ID, hashes Bangladesh phone, preserves event ID, and blocks Purchase', async () => {
  const originalFetch = global.fetch;
  Object.assign(process.env, { META_PIXEL_ID: '123456', NEXT_PUBLIC_META_PIXEL_ID: '123456', META_CAPI_ACCESS_TOKEN: 'test-only', META_TEST_EVENT_CODE: 'TEST1' });
  const calls = [];
  global.fetch = async (url, options) => { calls.push({ url, options, payload: JSON.parse(options.body) }); return Response.json({ events_received: 1 }); };
  try {
    const { sendMetaEvent } = loader()('lib/meta.ts');
    await sendMetaEvent({ eventName: 'Lead', eventId: 'lead_12345678', phone: '01700000000', email: ' TEST@EXAMPLE.COM ' });
    assert.equal(calls.length, 1);
    const event = calls[0].payload.data[0];
    assert.equal(event.event_id, 'lead_12345678');
    assert.equal(event.user_data.ph[0], createHash('sha256').update('8801700000000').digest('hex'));
    assert.equal(event.user_data.em[0], createHash('sha256').update('test@example.com').digest('hex'));
    assert.equal(calls[0].url.searchParams.has('access_token'), false);
    assert.equal(calls[0].options.redirect, 'error');
    assert.equal((await sendMetaEvent({ eventName: 'Purchase', eventId: 'purchase_12345678' })).sent, false);
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '999';
    assert.equal((await sendMetaEvent({ eventName: 'Lead', eventId: 'lead_12345678' })).sent, false);
    assert.equal(calls.length, 1);
  } finally { global.fetch = originalFetch; process.env = { ...originalEnv }; }
});

test('production CAPI never attaches a Meta Test Event Code', async () => {
  const originalFetch = global.fetch;
  Object.assign(process.env, {
    VERCEL_ENV: 'production',
    META_PIXEL_ID: '123456',
    NEXT_PUBLIC_META_PIXEL_ID: '123456',
    META_CAPI_ACCESS_TOKEN: 'test-only',
    META_TEST_EVENT_CODE: 'TEST_SHOULD_NOT_SHIP',
  });
  let payload;
  global.fetch = async (_url, options) => { payload = JSON.parse(options.body); return Response.json({ events_received: 1 }); };
  try {
    const { sendMetaEvent } = loader()('lib/meta.ts');
    const result = await sendMetaEvent({ eventName: 'PageView', eventId: 'pageview_12345678', eventSourceUrl: 'https://agentsiraji.com/store-audit' });
    assert.equal(result.sent, true);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'test_event_code'), false);
  } finally { global.fetch = originalFetch; process.env = { ...originalEnv }; }
});

test('browser event queue flushes after Pixel readiness and cannot track after consent withdrawal', async () => {
  const calls = []; let consent = 'granted';
  global.window = { localStorage: { getItem: () => consent }, fbq: (...args) => calls.push(args), location: { origin: 'https://agentsiraji.com', pathname: '/' } };
  global.document = { cookie: '' };
  try {
    const client = loader()('lib/meta-client.ts');
    await client.trackMetaEvent('Lead', {}, 'lead_12345678');
    assert.equal(calls.length, 0);
    client.markPixelReady();
    assert.equal(calls[0][3].eventID, 'lead_12345678');
    consent = 'denied'; client.revokePixelConsent();
    await client.trackMetaEvent('Lead', {}, 'lead_87654321');
    assert.equal(calls.filter(c => c[0] === 'track').length, 1);
  } finally { delete global.window; delete global.document; }
});

test('public Meta relay rejects fabricated conversions, missing consent and cross-origin requests', async () => {
  let sent = 0;
  const actual = loader()('lib/meta.ts');
  const { POST } = loader({ '@/lib/meta': { ...actual, sendMetaEvent: async () => { sent++; return { sent: true }; } } })('app/api/meta/events/route.ts');
  for (const eventName of ['Purchase', 'Lead', 'Contact', 'InitiateCheckout']) assert.equal((await POST(request({ consentGranted: true, eventName, eventId: 'test_12345678' }))).status, 400);
  assert.equal((await POST(request({ eventName: 'PageView', eventId: 'test_12345678' }))).status, 200);
  assert.equal((await POST(request({}, { origin: 'https://foreign.example' }))).status, 403);
  assert.equal(sent, 0);
});

test('public Meta relay preserves only same-origin page paths', async () => {
  const actual = loader()('lib/meta.ts');
  const sent = [];
  const { POST } = loader({ '@/lib/meta': { ...actual, sendMetaEvent: async (input) => { sent.push(input); return { sent: true }; } } })('app/api/meta/events/route.ts');
  const sameOrigin = new Request('https://agentsiraji.com/api/meta/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://agentsiraji.com' },
    body: JSON.stringify({ consentGranted: true, eventName: 'PageView', eventId: 'pageview_12345678', eventSourceUrl: 'https://agentsiraji.com/store-audit?utm_source=test#top' }),
  });
  assert.equal((await POST(sameOrigin)).status, 200);
  assert.equal(sent[0].eventSourceUrl, 'https://agentsiraji.com/store-audit');

  const foreignSource = new Request('https://agentsiraji.com/api/meta/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://agentsiraji.com' },
    body: JSON.stringify({ consentGranted: true, eventName: 'ViewContent', eventId: 'content_12345678', eventSourceUrl: 'https://foreign.example/steal' }),
  });
  assert.equal((await POST(foreignSource)).status, 200);
  assert.equal(sent[1].eventSourceUrl, 'https://agentsiraji.com');
});

test('PageView keeps one event ID through browser, relay and CAPI; decline sends nothing', async () => {
  const previousFetch = global.fetch;
  let consent = 'granted'; const browserEvents = []; const serverEvents = [];
  Object.assign(process.env, { META_PIXEL_ID: '1054067190449122', NEXT_PUBLIC_META_PIXEL_ID: '1054067190449122', META_CAPI_ACCESS_TOKEN: 'test-only', META_TEST_EVENT_CODE: 'TEST1' });
  global.window = { localStorage: { getItem: () => consent }, fbq: (...args) => browserEvents.push(args), location: { origin: 'http://127.0.0.1:3000', pathname: '/' } };
  global.document = { cookie: '' };
  const load = loader(); const { POST } = load('app/api/meta/events/route.ts');
  global.fetch = async (url, options) => {
    if (url === '/api/meta/events') return POST(new Request('http://localhost:3000/api/meta/events', { ...options, headers: { ...options.headers, origin: 'http://127.0.0.1:3000', host: '127.0.0.1:3000', 'user-agent': 'AgentSiraji test' } }));
    assert.equal(new URL(url).hostname, 'graph.facebook.com');
    serverEvents.push(JSON.parse(options.body).data[0]);
    return Response.json({ events_received: 1 });
  };
  try {
    const client = load('lib/meta-client.ts');
    const eventId = await client.trackMetaEvent('PageView');
    client.markPixelReady();
    assert.equal(browserEvents.length, 1); assert.equal(serverEvents.length, 1);
    assert.equal(browserEvents[0][1], serverEvents[0].event_name);
    assert.equal(browserEvents[0][3].eventID, eventId);
    assert.equal(serverEvents[0].event_id, eventId);
    consent = 'denied'; client.revokePixelConsent();
    await client.trackMetaEvent('PageView');
    assert.equal(serverEvents.length, 1);
    assert.equal(browserEvents.filter(e => e[0] === 'track').length, 1);
  } finally { global.fetch = previousFetch; process.env = { ...originalEnv }; delete global.window; delete global.document; }
});

test('Store Audit persists and sends one consented Lead event ID through CAPI', async () => {
  const actualMeta = loader()('lib/meta.ts');
  let savedLead; let metaEvent;
  const load = loader({
    '@/lib/attribution': { attributionFromRequest: () => ({ utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null, referrer: null, landingPath: '/store-audit' }) },
    '@/lib/sales-leads': { createSalesLead: async (input) => { savedLead = input; return { id: '42', status: 'NEW', createdAt: new Date().toISOString() }; } },
    '@/lib/store-audit-scanner': { scanStore: async () => { throw new Error('test scanner unavailable'); } },
    '@/lib/meta': { ...actualMeta, sendMetaEvent: async (input) => { metaEvent = input; return { sent: true }; } },
  });
  const previousResend = process.env.RESEND_API_KEY; const previousTo = process.env.CONTACT_TO_EMAIL;
  delete process.env.RESEND_API_KEY; delete process.env.CONTACT_TO_EMAIL;
  try {
    const { POST } = load('app/api/store-audit/route.ts');
    const response = await POST(new Request('https://agentsiraji.com/api/store-audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://agentsiraji.com', 'user-agent': 'Stage7 test', 'x-forwarded-for': '203.0.113.10' },
      body: JSON.stringify({ businessName: 'Demo Shop', country: 'Bangladesh', storeUrl: 'https://example.com', email: 'owner@example.com', whatsapp: '01700000000', productCount: '1–20', marketingConsent: true, metaEventId: 'lead_stage7_12345678', fbp: 'fb.1.test', fbc: 'fb.1.click' }),
    }));
    assert.equal(response.status, 200);
    assert.equal(savedLead.metaEventId, 'lead_stage7_12345678');
    assert.equal(savedLead.marketingConsent, true);
    assert.equal(metaEvent.eventName, 'Lead');
    assert.equal(metaEvent.eventId, 'lead_stage7_12345678');
    assert.equal(metaEvent.email, 'owner@example.com');
    assert.equal(metaEvent.phone, '01700000000');
    assert.equal(metaEvent.fbp, 'fb.1.test');
    assert.equal(metaEvent.eventSourceUrl, 'https://agentsiraji.com/store-audit');
  } finally {
    if (previousResend === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousResend;
    if (previousTo === undefined) delete process.env.CONTACT_TO_EMAIL; else process.env.CONTACT_TO_EMAIL = previousTo;
  }
});

test('Contact persists and sends one consented Contact event ID, while decline sends no CAPI conversion', async () => {
  const actualMeta = loader()('lib/meta.ts');
  const saved = []; const sent = [];
  const load = loader({
    '@/lib/attribution': { attributionFromRequest: () => ({ utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null, referrer: null, landingPath: '/contact' }) },
    '@/lib/sales-leads': { createSalesLead: async (input) => { saved.push(input); return { id: String(saved.length), status: 'NEW', createdAt: new Date().toISOString() }; } },
    '@/lib/meta': { ...actualMeta, sendMetaEvent: async (input) => { sent.push(input); return { sent: true }; } },
  });
  const previousResend = process.env.RESEND_API_KEY; const previousTo = process.env.CONTACT_TO_EMAIL;
  delete process.env.RESEND_API_KEY; delete process.env.CONTACT_TO_EMAIL;
  try {
    const { POST } = load('app/api/contact/route.ts');
    const base = { name: 'Demo Owner', email: 'owner@example.com', interest: 'Commerce sales', message: 'I need a branded commerce website for my social business.' };
    const accepted = await POST(new Request('https://agentsiraji.com/api/contact', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://agentsiraji.com' },
      body: JSON.stringify({ ...base, marketingConsent: true, metaEventId: 'contact_stage7_12345678', fbp: 'fb.1.test' }),
    }));
    assert.equal(accepted.status, 200);
    assert.equal(saved[0].metaEventId, 'contact_stage7_12345678');
    assert.equal(saved[0].marketingConsent, true);
    assert.equal(sent[0].eventName, 'Contact');
    assert.equal(sent[0].eventId, 'contact_stage7_12345678');

    const declined = await POST(new Request('https://agentsiraji.com/api/contact', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://agentsiraji.com', 'x-forwarded-for': '203.0.113.99' },
      body: JSON.stringify({ ...base, marketingConsent: false, metaEventId: 'contact_should_not_send' }),
    }));
    assert.equal(declined.status, 200);
    assert.equal(saved[1].metaEventId, null);
    assert.equal(saved[1].marketingConsent, false);
    assert.equal(sent.length, 1);
  } finally {
    if (previousResend === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousResend;
    if (previousTo === undefined) delete process.env.CONTACT_TO_EMAIL; else process.env.CONTACT_TO_EMAIL = previousTo;
  }
});

test('public Pixel fallback works without a database and never exposes saved secrets', async () => {
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID; delete process.env.META_PIXEL_ID;
  try {
    const failing = loader({ '@/lib/integration-config': { readStoredIntegrations: async () => { throw new Error('unconfigured'); } } })('app/api/integrations/public/route.ts');
    assert.deepEqual(await (await failing.GET()).json(), { pixelId: '1054067190449122' });
    const saved = loader({ '@/lib/integration-config': { readStoredIntegrations: async () => ({ metaPixelId: '1054067190449122', metaCapiAccessToken: 'private-test-token' }) } })('app/api/integrations/public/route.ts');
    assert.deepEqual(await (await saved.GET()).json(), { pixelId: '1054067190449122' });
  } finally { process.env = { ...originalEnv }; }
});
