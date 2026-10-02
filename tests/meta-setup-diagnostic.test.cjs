const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('temporary Meta setup route is static, isolated and noindex', () => {
  const page = fs.readFileSync('app/meta-setup/page.tsx', 'utf8');
  const layout = fs.readFileSync('app/meta-setup/layout.tsx', 'utf8');
  assert.match(layout, /1054067190449122/);
  assert.match(layout, /fbq\('init'/);
  assert.match(layout, /fbq\('track','PageView'\)/);
  assert.match(layout, /www\.facebook\.com\/tr\?id=/);
  assert.doesNotMatch(layout, /fbq\('track','(?:Lead|Contact|Purchase|InitiateCheckout)'/);
  assert.doesNotMatch(page, /next\/script|use client|useState/);
  assert.match(layout, /index: false/);
  assert.match(layout, /follow: false/);
});
