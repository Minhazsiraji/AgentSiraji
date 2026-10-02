const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('homepage temporarily allows only Meta Event Setup framing while other routes stay strict', () => {
  const config = fs.readFileSync('next.config.ts', 'utf8');

  assert.match(config, /source: "\/"/);
  assert.match(config, /frame-ancestors https:\/\/business\.facebook\.com https:\/\/eventsmanager\.facebook\.com https:\/\/\*\.facebook\.com/);
  assert.match(config, /Cross-Origin-Opener-Policy", value: "unsafe-none"/);
  assert.match(config, /Cross-Origin-Resource-Policy", value: "cross-origin"/);

  assert.match(config, /source: "\/:path\+"/);
  assert.match(config, /X-Frame-Options", value: "DENY"/);
  assert.match(config, /frame-ancestors 'none'/);
});
