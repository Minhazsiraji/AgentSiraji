const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const loader = require('./load-ts.cjs');

const originalEnv = { ...process.env };

test('Google tag IDs accept supported public formats only', () => {
  const { validGoogleTagId } = loader()('lib/google-client.ts');
  assert.equal(validGoogleTagId('G-ABC123XYZ'), true);
  assert.equal(validGoogleTagId('GT-ABC_123'), true);
  assert.equal(validGoogleTagId('AW-123456789'), true);
  assert.equal(validGoogleTagId('GTM-ABC123'), false);
  assert.equal(validGoogleTagId('https://example.com'), false);
});

test('Google tracking stays disabled without consent and revokes after withdrawal', () => {
  let consent = 'denied';
  global.window = {
    localStorage: { getItem: () => consent },
    location: { origin: 'https://agentsiraji.com' },
    dataLayer: [],
  };
  global.document = { title: 'AgentSiraji' };
  try {
    const google = loader()('lib/google-client.ts');
    assert.equal(google.initializeGoogleTag('G-ABC123XYZ'), false);
    assert.equal(google.trackGoogleLead('store_audit'), false);
    assert.equal(global.window.dataLayer.length, 0);

    consent = 'granted';
    assert.equal(google.initializeGoogleTag('G-ABC123XYZ'), true);
    assert.equal(google.trackGooglePageView('/store-audit'), true);
    assert.equal(google.trackGoogleLead('store_audit'), true);
    assert.equal(global.window.dataLayer.some(args => args[0] === 'config' && args[1] === 'G-ABC123XYZ' && args[2].send_page_view === false), true);
    assert.equal(global.window.dataLayer.some(args => args[0] === 'event' && args[1] === 'page_view' && args[2].page_path === '/store-audit'), true);
    assert.equal(global.window.dataLayer.some(args => args[0] === 'event' && args[1] === 'generate_lead' && args[2].lead_source === 'store_audit'), true);

    consent = 'denied';
    google.revokeGoogleConsent();
    const before = global.window.dataLayer.filter(args => args[0] === 'event').length;
    assert.equal(google.trackGoogleLead('contact'), false);
    assert.equal(global.window.dataLayer.filter(args => args[0] === 'event').length, before);
    assert.equal(global.window.dataLayer.some(args => args[0] === 'consent' && args[1] === 'update' && args[2].analytics_storage === 'denied'), true);
  } finally {
    delete global.window;
    delete global.document;
  }
});

test('public integration endpoint exposes only public IDs, never Google API secrets', async () => {
  delete process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID;
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
  delete process.env.META_PIXEL_ID;
  try {
    const { GET } = loader({
      '@/lib/integration-config': {
        readStoredIntegrations: async () => ({
          metaPixelId: '1054067190449122',
          googleMeasurementId: 'G-AGENTSIRAJI1',
          googleApiSecret: 'must-never-leak',
        }),
      },
    })('app/api/integrations/public/route.ts');
    const payload = await (await GET()).json();
    assert.deepEqual(payload, { pixelId: '1054067190449122', googleTagId: 'G-AGENTSIRAJI1' });
    assert.equal(JSON.stringify(payload).includes('must-never-leak'), false);
  } finally {
    process.env = { ...originalEnv };
  }
});

test('production CSP permits Google tag and Analytics delivery endpoints', () => {
  const config = fs.readFileSync('next.config.ts', 'utf8');
  for (const required of [
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
  ]) assert.equal(config.includes(required), true, `missing ${required}`);
});
