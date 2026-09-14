const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

test("admin leads inbox uses compact responsive paginated list", () => {
  const source = read("components/AdminLeadsInbox.tsx");
  assert.match(source, /const PAGE_SIZE = 10/);
  assert.match(source, /role="table"/);
  assert.match(source, /lead-list-header/);
  assert.match(source, /lead-list-row/);
  assert.match(source, /Source/);
  assert.match(source, /Page \{safePage\} of \{pageCount\}/);
  assert.match(source, /@media\(max-width:1100px\)/);
  assert.match(source, /@media\(max-width:700px\)/);
});

test("admin page keeps one pilot payment console and removes duplicate manual payment reviewer", () => {
  const source = read("app/admin/page.tsx");
  assert.match(source, /LeadStatusReviewForm/);
  assert.doesNotMatch(source, /ManualPaymentReviewForm/);
  assert.match(source, /only payment-review path needed for the current direct-bKash pilot/);
});

test("lead review remains preloaded from inbox without changing protected API", () => {
  const inbox = read("components/AdminLeadsInbox.tsx");
  const review = read("components/LeadStatusReviewForm.tsx");
  const api = read("app/api/admin/leads/route.ts");
  assert.match(inbox, /agentsiraji:lead-review/);
  assert.match(review, /agentsiraji:lead-review/);
  assert.match(api, /platformAdminSession/);
  assert.match(api, /provisionVerifiedBkashLead/);
  assert.match(api, /status === "WON" && paymentStatus === "VERIFIED"/);
});
