const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

test("verified bKash WON leads require explicit plan selection and provisioning", () => {
  const route = read("app/api/admin/leads/route.ts");
  assert.match(route, /pilotPlanCodes/);
  assert.match(route, /status === "WON" && paymentStatus === "VERIFIED"/);
  assert.match(route, /Select Starter, Growth or Pro/);
  assert.match(route, /provisionVerifiedBkashLead/);
  assert.match(route, /actorAccountId: admin\.accountId/);
});

test("pilot provisioning creates the complete Commerce ownership and entitlement chain", () => {
  const source = read("lib/pilot-provisioning.ts");
  assert.match(source, /getCheckoutCommercialContext/);
  assert.match(source, /INSERT INTO accounts/);
  assert.match(source, /INSERT INTO organizations/);
  assert.match(source, /INSERT INTO organization_members/);
  assert.match(source, /INSERT INTO subscriptions/);
  assert.match(source, /INSERT INTO payments/);
  assert.match(source, /INSERT INTO entitlements/);
  assert.match(source, /'ACTIVE', 'MANUAL_INVOICE'/);
  assert.match(source, /'PAID', now\(\)/);
  assert.match(source, /BKASH_PILOT_PROVISIONED/);
  assert.match(source, /COMMERCE_PROVISIONED/);
});

test("pilot provisioning is idempotent and transaction references cannot be reused", () => {
  const source = read("lib/pilot-provisioning.ts");
  assert.match(source, /alreadyProvisioned: true/);
  assert.match(source, /provider_transaction_id = \$\{providerTransactionId\}/);
  assert.match(source, /This bKash transaction has already been used for another commercial payment/);
  assert.match(source, /payment_expected_amount = \$\{planTotal\}/);
  assert.match(source, /payment_verified_amount = \$\{planTotal\}/);
});

test("owner UI requires an explicit plan and reports customer provisioning", () => {
  const source = read("components/LeadStatusReviewForm.tsx");
  assert.match(source, /Commerce plan/);
  assert.match(source, /planCode/);
  assert.match(source, /Save, verify & provision/);
  assert.match(source, /They can now request a magic sign-in link/);
});

test("global social metadata does not claim the homepage URL for every route", () => {
  const layout = read("app/layout.tsx");
  assert.doesNotMatch(layout, /url:\s*siteUrl/);
  assert.match(layout, /card:\s*"summary"/);
  assert.doesNotMatch(layout, /summary_large_image/);
});

test("passwordless sign-in title uses the root title template once", () => {
  const signIn = read("app/sign-in/page.tsx");
  assert.match(signIn, /title:\s*"Sign in"/);
  assert.doesNotMatch(signIn, /title:\s*"Sign in \| AgentSiraji"/);
});
