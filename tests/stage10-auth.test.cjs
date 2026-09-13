const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const loader = require('./load-ts.cjs');

const read = file => fs.readFileSync(file, 'utf8');

test('auth schema stores only hashed one-time links and sessions with explicit platform roles', () => {
  const sql = read('database/0007_auth_foundation.sql');
  assert.match(sql, /auth_magic_links/);
  assert.match(sql, /token_hash text NOT NULL UNIQUE/i);
  assert.match(sql, /auth_sessions/);
  assert.match(sql, /session_hash text NOT NULL UNIQUE/i);
  assert.match(sql, /PLATFORM_OWNER/);
  assert.match(sql, /PLATFORM_ADMIN/);
  assert.match(sql, /auth_security_events/);
  assert.doesNotMatch(sql, /password_hash|password\s+text/i);
});

test('auth redirect validation rejects external and protocol-relative redirects', () => {
  const { safeRedirectPath } = loader({ '@/lib/db': { db: () => { throw new Error('not used'); } } })('lib/auth.ts');
  assert.equal(safeRedirectPath('/admin?tab=one'), '/admin?tab=one');
  assert.equal(safeRedirectPath('//evil.example'), '/account/commerce');
  assert.equal(safeRedirectPath('https://evil.example'), '/account/commerce');
  assert.equal(safeRedirectPath(''), '/account/commerce');
});

test('production session cookie uses Host prefix and secure HttpOnly Lax settings', () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'production';
  try {
    const load = loader({ '@/lib/db': { db: () => { throw new Error('not used'); } } });
    const auth = load('lib/auth.ts');
    const options = auth.authCookieOptions(new Date('2030-01-01T00:00:00Z'));
    assert.equal(auth.authSessionCookie, '__Host-agentsiraji_session');
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.path, '/');
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
  }
});

test('customer account lookup is session-scoped through organization membership, not transaction reference', () => {
  const route = read('app/api/account/commerce/route.ts');
  const page = read('app/account/commerce/page.tsx');
  assert.match(route, /readSession/);
  assert.match(route, /organization_members/);
  assert.match(route, /om\.account_id\s*=\s*\$\{session\.accountId\}/);
  assert.doesNotMatch(page, /transactionId|provider=/);
  assert.match(page, /Payment references\s+are no longer used as account credentials/i);
});

test('admin analytics, leads, payments and pricing use platform admin sessions', () => {
  for (const file of [
    'app/api/admin/analytics/route.ts',
    'app/api/admin/leads/route.ts',
    'app/api/admin/bkash-pilot/route.ts',
    'app/api/admin/commercial-payments/review/route.ts',
    'app/api/admin/commercial-offers/route.ts',
  ]) {
    const source = read(file);
    assert.match(source, /platformAdminSession/);
    assert.doesNotMatch(source, /x-agentsiraji-admin-token/);
  }
});

test('manual payment review binds reviewer to authenticated account', () => {
  const route = read('app/api/admin/commercial-payments/review/route.ts');
  assert.match(route, /reviewedByAccountId:\s*admin\.accountId/);
});

test('owner bootstrap requires both email session and legacy proof and closes after first owner', () => {
  const route = read('app/api/auth/bootstrap-owner/route.ts');
  assert.match(route, /readSession/);
  assert.match(route, /COMMERCIAL_ADMIN_REVIEW_TOKEN/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /PLATFORM_OWNER/);
  assert.match(route, /bootstrap is already closed/i);
});

test('magic links are single use, expire and create revocable sessions', () => {
  const auth = read('lib/auth.ts');
  assert.match(auth, /consumed_at IS NULL/);
  assert.match(auth, /expires_at > now\(\)/);
  assert.match(auth, /revoked_at IS NULL/);
  assert.match(auth, /SESSION_REVOKED/);
  assert.match(auth, /randomBytes\(32\)/);
});

test('sign-in and account/admin pages remain out of search indexing', () => {
  assert.match(read('app/sign-in/page.tsx'), /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(read('app/account/commerce/page.tsx'), /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(read('app/admin/page.tsx'), /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
});
