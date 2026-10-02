const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('temporary Meta setup route is isolated and noindex', () => {
  const page = fs.readFileSync('app/meta-setup/page.tsx', 'utf8');
  const layout = fs.readFileSync('app/meta-setup/layout.tsx', 'utf8');
  assert.match(page, /1054067190449122/);
  assert.match(page, /fbq\('track','PageView'\)/);
  assert.doesNotMatch(page, /Lead|Contact|Purchase|InitiateCheckout/);
  assert.match(layout, /index: false/);
  assert.match(layout, /follow: false/);
});
