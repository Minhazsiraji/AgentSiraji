/** AS-02 fail-closed persistence gate.
 * Inputs: candidate (one normalized TED candidate), find_result (Tables -> Find Records
 * with EXACT source_url filter), exact_lookup_performed=true.
 * Only outputs a payload for create when the authenticated Tables lookup returned zero rows.
 * Non-atomic; keep this manual/sequential without overlapping runs.
 */
export const code = async (inputs = {}) => {
  const result = { should_create: false, reason: "", create_fields: null, outbound_enabled: false };
  const c = inputs.candidate || {};
  const source = String(c.source_url || "");
  const match = source.match(/^https:\/\/ted\.europa\.eu\/en\/notice\/-\/detail\/(\d{5,7}-20\d{2})$/);
  if (!match || c.outbound_enabled !== false || c.status !== "REVIEW_SOURCE_AND_BUYER" ||
      c.source_verified !== "no" || String(c.source_key) !== "TED:" + match[1]) {
    return {...result, reason: "UNTRUSTED_OR_INCOMPLETE_CANDIDATE"};
  }
  if (inputs.exact_lookup_performed !== true) {
    return {...result, reason: "LOOKUP_NOT_CONFIRMED"};
  }
  const found = inputs.find_result;
  const rows = Array.isArray(found) ? found :
    Array.isArray(found?.records) ? found.records :
    Array.isArray(found?.items) ? found.items : null;
  if (rows === null) return {...result, reason: "LOOKUP_SHAPE_UNRECOGNIZED"};
  if (rows.length > 0) return {...result, reason: "ALREADY_IN_QUEUE"};
  // Deliberately map only the 7 fields known to exist in the Discovery Queue.
  const fieldNames = ["opportunity_title","opportunity_excerpt","source_url",
    "publisher","service_needed","published_at","status"];
  const record = {};
  for (const key of fieldNames) record[key] = String(c[key] ?? "").slice(0, key === "opportunity_excerpt" ? 450 : 240);
  if (!record.opportunity_title || !record.source_url || !record.status) {
    return {...result, reason: "MISSING_REQUIRED_FIELD"};
  }
  return {should_create: true, reason: "NEW_UNVERIFIED_QUEUE_CANDIDATE",
    create_fields: record, outbound_enabled: false};
};
