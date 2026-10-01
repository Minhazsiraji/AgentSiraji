const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

test("direct Commerce plan intent pairs browser Pixel Lead with server CAPI event ID", () => {
  const form = read("components/CommercePlanIntentForm.tsx");
  const tracking = read("components/MetaTracking.tsx");
  const route = read("app/api/commerce/order-intent/route.ts");

  assert.match(form, /createMetaEventId\("commerce_plan_intent"\)/);
  assert.match(form, /agentsiraji:commerce-intent-saved/);
  assert.match(form, /eventId: metaEventId/);

  assert.match(tracking, /addEventListener\("agentsiraji:commerce-intent-saved"/);
  assert.match(tracking, /trackMetaEvent\("Lead"/);
  assert.match(tracking, /conversionEventId\(event, "commerce_plan_intent"\)/);
  assert.match(tracking, /content_category: "commerce_plan_intent"/);

  assert.match(route, /eventName: "Lead"/);
  assert.match(route, /eventId: meta\.eventId/);
  assert.match(route, /content_category: "commerce_plan_intent"/);
});
