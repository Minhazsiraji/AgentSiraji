const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

test("Commerce and pricing cards offer direct plan start plus optional audit", () => {
  for (const file of ["app/products/commerce/page.tsx", "app/pricing/page.tsx"]) {
    const source = read(file);
    assert.match(source, /href={`\/start\/commerce\?plan=\$\{plan\.id\}`}/);
    assert.match(source, /Start \{plan\.name\}/);
    assert.match(source, /Not sure\? Get a free store audit/);
  }
});

test("direct Commerce start page carries selected plan into the onboarding form", () => {
  const source = read("app/start/commerce/page.tsx");
  assert.match(source, /searchParams: Promise<\{ plan\?: string \}>/);
  assert.match(source, /CommercePlanIntentForm/);
  assert.match(source, /initialPlan=\{selected\.id\}/);
  assert.match(source, /Submitting this form does not charge|before anything is charged/);
});

test("Commerce intent API persists into the existing sales lead pipeline", () => {
  const source = read("app/api/commerce/order-intent/route.ts");
  assert.match(source, /createSalesLead/);
  assert.match(source, /leadType: "CONTACT"/);
  assert.match(source, /COMMERCE_ORDER_INTENT/);
  assert.match(source, /Commerce sales —/);
  assert.match(source, /deliverLeadToLeadPilot/);
  assert.match(source, /sendMetaEvent/);
  assert.match(source, /No payment has been taken/);
});

test("public plan intent cannot activate or create a payment", () => {
  const source = read("app/api/commerce/order-intent/route.ts");
  assert.doesNotMatch(source, /createPendingCheckout/);
  assert.doesNotMatch(source, /INSERT INTO payments/);
  assert.doesNotMatch(source, /INSERT INTO subscriptions/);
  assert.doesNotMatch(source, /provisionVerifiedBkashLead/);
  assert.match(source, /scope confirmation required before payment instruction/);
});

test("plan intent form is consent-aware and posts only to the order-intent endpoint", () => {
  const source = read("components/CommercePlanIntentForm.tsx");
  assert.match(source, /hasMarketingConsent/);
  assert.match(source, /createMetaEventId\("commerce_plan_intent"\)/);
  assert.match(source, /\/api\/commerce\/order-intent/);
  assert.match(source, /No payment is taken on this page/);
  assert.match(source, /Start \$\{selected\.name\}/);
});
