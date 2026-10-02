const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('public measurement consent controls stay hidden from the site UI', () => {
  const css = fs.readFileSync('app/meta-consent.css', 'utf8');
  assert.match(css, /\.marketing-consent[\s\S]*\.marketing-preferences[\s\S]*display:\s*none\s*!important/);
});
