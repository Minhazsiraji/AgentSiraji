const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./load-ts.cjs');

test('regional measurement policy requires opt-in only for explicit EEA, UK and Switzerland country codes', () => {
  const { measurementConsentModeForCountry } = loader()('lib/measurement-region.ts');
  for (const code of ['DE', 'FR', 'NO', 'GB', 'UK', 'CH']) {
    assert.equal(measurementConsentModeForCountry(code), 'opt-in');
  }
});

test('regional measurement policy defaults to opt-out for Bangladesh, known non-restricted regions and unresolved country codes', () => {
  const { measurementConsentModeForCountry } = loader()('lib/measurement-region.ts');
  for (const code of ['BD', 'US', 'AE', 'QA', 'GH', 'NP', '', 'XX']) {
    assert.equal(measurementConsentModeForCountry(code), 'opt-out');
  }
});

test('measurement region API uses request country and never caches the decision', async () => {
  const { GET } = loader()('app/api/privacy/measurement-region/route.ts');
  const bd = await GET(new Request('https://agentsiraji.com/api/privacy/measurement-region', { headers: { 'x-vercel-ip-country': 'BD' } }));
  assert.deepEqual(await bd.json(), { mode: 'opt-out' });
  assert.match(bd.headers.get('cache-control') || '', /no-store/);

  const de = await GET(new Request('https://agentsiraji.com/api/privacy/measurement-region', { headers: { 'x-vercel-ip-country': 'DE' } }));
  assert.deepEqual(await de.json(), { mode: 'opt-in' });

  const unknown = await GET(new Request('https://agentsiraji.com/api/privacy/measurement-region'));
  assert.deepEqual(await unknown.json(), { mode: 'opt-out' });
});

test('Meta tracking preserves saved choices and auto-grants after an opt-out-region decision', () => {
  const fs = require('node:fs');
  const source = fs.readFileSync('components/MetaTracking.tsx', 'utf8');
  assert.match(source, /localStorage\.getItem\(marketingConsentKey\)/);
  assert.match(source, /data\.mode !== "opt-out"/);
  assert.match(source, /localStorage\.setItem\(marketingConsentKey, "granted"\)/);
  assert.match(source, /regionResolved && \(consent === null \|\| preferencesOpen\)/);
});
