const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

test("admin page renders the authenticated leads inbox before payment review", () => {
  const source = read("app/admin/page.tsx");
  assert.match(source, /AdminLeadsInbox/);
  assert.match(source, /Sales inbox/);
  assert.match(source, /LeadStatusReviewForm/);
  assert.match(source, /ManualPaymentReviewForm/);
});

test("leads inbox loads protected lead data and supports search/status workflow", () => {
  const source = read("components/AdminLeadsInbox.tsx");
  assert.match(source, /fetch\("\/api\/admin\/leads"/);
  assert.match(source, /Search/);
  assert.match(source, /Mark contacted/);
  assert.match(source, /Mark qualified/);
  assert.match(source, /Move to proposal/);
  assert.match(source, /Mark lost/);
  assert.match(source, /Review \/ payment/);
});

test("quick status updates preserve payment state instead of bypassing verification", () => {
  const source = read("components/AdminLeadsInbox.tsx");
  assert.match(source, /paymentStatus: lead\.paymentStatus/);
  assert.match(source, /paymentReference: lead\.paymentReference/);
  assert.match(source, /paymentExpectedAmount: lead\.paymentExpectedAmount/);
  assert.doesNotMatch(source, /move\(lead, "WON"\)/);
});

test("inbox selection prefills the existing protected bKash review console", () => {
  const source = read("components/LeadStatusReviewForm.tsx");
  assert.match(source, /agentsiraji:lead-review/);
  assert.match(source, /id="lead-review-console"/);
  assert.match(source, /setLeadId\(detail\.id\)/);
  assert.match(source, /Commerce sales — \(Starter\|Growth\|Pro\)/);
});

test("admin leads API remains session-protected and WON still requires verified provisioning", () => {
  const source = read("app/api/admin/leads/route.ts");
  assert.match(source, /platformAdminSession/);
  assert.match(source, /Unauthorized lead access/);
  assert.match(source, /status === "WON" && paymentStatus === "VERIFIED"/);
  assert.match(source, /provisionVerifiedBkashLead/);
});
