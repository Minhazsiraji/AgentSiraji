const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('integration admin API is token protected, no-store and same-origin for writes', () => {
  const route = read('app/api/admin/integrations/route.ts');
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /x-agentsiraji-admin-token/);
  assert.match(route, /Unauthorized integration access/);
  assert.match(route, /Cache-Control.*no-store/s);
  assert.match(route, /requestOriginAllowed\(request\)/);
});

test('Google tag configuration accepts G, AW and GT identifiers', () => {
  const route = read('app/api/admin/integrations/route.ts');
  assert.match(route, /\^\(G-\|AW-\|GT-\)/);
  assert.match(route, /Google tag ID must start with G-, AW- or GT-/);
  const ui = read('components/IntegrationSettings.tsx');
  assert.match(ui, /Google tag/);
  assert.match(ui, /G-, AW- and GT-/);
});

test('changing LeadPilot destination cannot reuse a previously saved ingest key', () => {
  const route = read('app/api/admin/integrations/route.ts');
  assert.match(route, /leadDestinationChanged/);
  assert.match(route, /Changing the LeadPilot endpoint requires entering its ingest key again/);
  assert.match(route, /leadDestinationChanged \|\| leadKeyChanged/);
  assert.match(route, /Confirm that the LeadPilot endpoint and ingest key belong to AgentSiraji/);
});

test('stored integration secrets use authenticated encryption and are never returned by public route', () => {
  const config = read('lib/integration-config.ts');
  assert.match(config, /aes-256-gcm/);
  assert.match(config, /getAuthTag/);
  assert.match(config, /setAuthTag/);
  const publicRoute = read('app/api/integrations/public/route.ts');
  assert.match(publicRoute, /pixelId/);
  assert.doesNotMatch(publicRoute, /metaCapiAccessToken|googleApiSecret|leadPilotIngestKey/);
});

test('integration center stays private from search and public navigation', () => {
  const page = read('app/admin/integrations/page.tsx');
  assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(page, /href="\/admin"/);
  const admin = read('app/admin/page.tsx');
  assert.match(admin, /href="\/admin\/integrations"/);
  const chrome = read('components/SiteChrome.tsx');
  assert.doesNotMatch(chrome, /\/admin\/integrations/);
});
