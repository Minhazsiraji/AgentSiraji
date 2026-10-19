import assert from "node:assert/strict";
import test from "node:test";
import { code } from "./score-lead.mjs";

const good = {
  business_name: "Example Merchant", country: "Ireland",
  website: "https://example.org", source_url: "https://example.org/news",
  verified_need: "We are looking for a new booking website for our storefront.",
  service_needed: "website development", source_verified: true,
  service_fit_verified: true, buyer_contact_verified: true,
  opportunity_current: true, do_not_contact: false, duplicate: false
};

test("qualified lead becomes human-review-only, never auto-send", async () => {
  const out = await code(good);
  assert.equal(out.quality_score, 100);
  assert.equal(out.lead_status, "READY_FOR_HUMAN_REVIEW");
  assert.equal(out.send_enabled, false);
  assert.match(out.draft_message, /https:\/\/example.org\/news/);
});

test("missing evidence URL stops review even if source_verified checked", async () => {
  const out = await code({ ...good, source_url: "" });
  assert.equal(out.lead_status, "RESEARCH_MORE");
  assert.equal(out.quality_score, 80);
  assert.equal(out.draft_message, "");
});

test("do not contact blocks even strong lead", async () => {
  const out = await code({ ...good, do_not_contact: "yes" });
  assert.equal(out.lead_status, "DO_NOT_CONTACT");
  assert.equal(out.draft_message, "");
});

test("duplicates do not create outreach drafts", async () => {
  const out = await code({ ...good, duplicate: true });
  assert.equal(out.lead_status, "DUPLICATE_REVIEW");
  assert.equal(out.draft_subject, "");
});

test("vague unsupported needs are disqualified", async () => {
  const out = await code({ ...good, verified_need: "maybe" });
  assert.equal(out.quality_score, 70);
  assert.equal(out.lead_status, "RESEARCH_MORE");
});

test("service fit missing blocks score eligibility", async () => {
  const out = await code({ ...good, service_fit_verified: "false" });
  assert.equal(out.quality_score, 75);
  assert.equal(out.lead_status, "RESEARCH_MORE");
});

test("minimum verified fit qualifies without buyer route or urgency", async () => {
  const out = await code({ ...good, buyer_contact_verified: false, opportunity_current: false });
  assert.equal(out.quality_score, 75);
  assert.equal(out.lead_status, "READY_FOR_HUMAN_REVIEW");
});

test("empty company always fails the gate", async () => {
  const out = await code({ ...good, business_name: "" });
  assert.equal(out.lead_status, "RESEARCH_MORE");
  assert.equal(out.draft_message, "");
});

test("missing inputs are safe", async () => {
  const out = await code();
  assert.equal(out.quality_score, 0);
  assert.equal(out.send_enabled, false);
  assert.equal(out.lead_status, "RESEARCH_MORE");
});

test("value formatting from table strings is supported", async () => {
  const out = await code({ ...good, source_verified: "YES", service_fit_verified: "TRUE",
    buyer_contact_verified: "1", opportunity_current: "true" });
  assert.equal(out.quality_score, 100);
});
