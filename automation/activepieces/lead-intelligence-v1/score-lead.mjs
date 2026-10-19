/**
 * Activepieces Code step: "Lead Quality Gate".
 * No external libraries, AI provider, network calls or outbound messaging.
 *
 * Map the Code step's Input fields from the Tables / New Record Created
 * trigger, using the exact field names documented in SETUP.md.
 */
export const code = async (inputs = {}) => {
  const str = (v, max = 300) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  const yes = (v) => v === true || v === 1 || /^(true|yes|1)$/i.test(str(v));
  const company = str(inputs.business_name, 120);
  const country = str(inputs.country, 90);
  const website = str(inputs.website, 300);
  const evidenceUrl = str(inputs.source_url, 500);
  const need = str(inputs.verified_need, 240);
  const service = str(inputs.service_needed, 90);
  const sourceVerified = yes(inputs.source_verified) && /^https?:\/\/[^ @]+\.[^ @]+/i.test(evidenceUrl);
  const fit = yes(inputs.service_fit_verified) && Boolean(service);
  const buyerRoute = yes(inputs.buyer_contact_verified);
  const timeSensitive = yes(inputs.opportunity_current);
  const blocked = yes(inputs.do_not_contact);
  const duplicate = yes(inputs.duplicate);
  const reasons = [];

  let score = 0;
  if (sourceVerified) score += 20; else reasons.push("SOURCE_UNVERIFIED");
  if (need.length >= 15) score += 30; else reasons.push("NEED_NOT_SPECIFIC");
  if (fit) score += 25; else reasons.push("SERVICE_FIT_UNVERIFIED");
  if (buyerRoute) score += 10; else reasons.push("BUYER_ROUTE_UNVERIFIED");
  if (timeSensitive) score += 15; else reasons.push("NO_CURRENT_SIGNAL");
  if (!company) reasons.push("COMPANY_REQUIRED");
  if (blocked) reasons.push("DO_NOT_CONTACT");
  if (duplicate) reasons.push("DUPLICATE");

  const canReview = Boolean(company) && sourceVerified && need.length >= 15 &&
    fit && !blocked && !duplicate && score >= 75;
  const status = blocked ? "DO_NOT_CONTACT" :
    duplicate ? "DUPLICATE_REVIEW" :
    canReview ? "READY_FOR_HUMAN_REVIEW" : "RESEARCH_MORE";

  const domain = website.replace(/^https?:\/\//i, "").replace(/^www\./i, "")
    .split(/[/?#]/)[0].toLowerCase();
  const keySource = domain || (company + "|" + country).toLowerCase();
  // Key is for finding potential duplicates, not proof of uniqueness.
  const dedupeKey = keySource.replace(/[^a-z0-9.|-]/g, "-").slice(0, 120);
  const subject = canReview ? "A practical " + service + " idea for " + company : "";
  const message = canReview ?
    "Hello " + company + " team,\n\n" +
    "I came across this public reference about your business: " + evidenceUrl + "\n" +
    "It mentions: " + need + "\n\n" +
    "I work with businesses on " + service + ". If this is still a priority, " +
    "I can share a short, tailored proposal focused on the specific outcome you're looking for.\n\n" +
    "Would you be open to reviewing a brief suggestion?\n\n" +
    "Best regards,\nAgentSiraji" : "";

  return {
    business_name: company, country, website,
    lead_key: dedupeKey, quality_score: score, lead_status: status,
    reason_codes: reasons.join(","),
    draft_subject: subject, draft_message: message,
    source_verified_for_review: sourceVerified,
    contact_policy: "MANUAL_APPROVAL_REQUIRED",
    send_enabled: false,
    // Notes: score is rules-based, not an AI probability.
    scoring_version: "v1.0.0"
  };
};
