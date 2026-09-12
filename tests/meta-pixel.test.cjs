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

test('public Pixel fallback works without a database and never exposes saved secrets', async () => {
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID; delete process.env.META_PIXEL_ID;
  try {
    const failing = loader({ '@/lib/integration-config': { readStoredIntegrations: async () => { throw new Error('unconfigured'); } } })('app/api/integrations/public/route.ts');
    assert.deepEqual(await (await failing.GET()).json(), { pixelId: '1054067190449122' });
    const saved = loader({ '@/lib/integration-config': { readStoredIntegrations: async () => ({ metaPixelId: '1054067190449122', metaCapiAccessToken: 'private-test-token' }) } })('app/api/integrations/public/route.ts');
    assert.deepEqual(await (await saved.GET()).json(), { pixelId: '1054067190449122' });
  } finally { process.env = { ...originalEnv }; }
});
