/**
 * AS-02 convert HTTP TED Search API response to review-only candidate rows.
 * Never uses search result to infer consent or to send messages.
 * Input fields:
 * - ted_response: Activepieces HTTP response (possibly wrapped in {body:{...}})
 * - source_authorized: explicitly true only for official TED endpoint
 * - now: ISO timestamp
 * - max_candidates: capped at 3
 */
export const code = async (inputs = {}) => {
  const yes = v => v === true || v === "true" || v === "yes";
  if (!yes(inputs.source_authorized)) return {candidates: [], blocked: "SOURCE_NOT_APPROVED", outbound_enabled: false};
  const json = v => { if (typeof v === "string") { try { return JSON.parse(v); } catch { return {}; } } return v || {}; };
  const raw = json(inputs.ted_response);
  const data = json(raw.body ?? raw.data ?? raw);
  if (!Array.isArray(data.notices)) return {candidates: [], blocked: "NO_VALID_TED_NOTICES", outbound_enabled: false};
  const now = inputs.now ? new Date(inputs.now) : new Date();
  if (Number.isNaN(now.valueOf())) return {candidates: [], blocked: "INVALID_DATE", outbound_enabled: false};
  const limit = Math.max(1, Math.min(3, Math.floor(Number(inputs.max_candidates) || 3)));
  const results = [];
  const seen = new Set();
  const approvedMarkets = new Set(["ireland","netherlands","finland","cyprus","luxembourg"]);
  const serviceCases = [
    ["website development", /\b(website|websites|web design|web development|web application|digital portal|e-commerce|ecommerce)\b/i],
    ["digital marketing", /\b(advertising|digital marketing|marketing campaign|digital campaign|social media|seo|search engine optimisation|search engine optimization)\b/i],
    ["business automation", /\b(workflow automation|business process automation|process automation|chatbot development|ai integration)\b/i]
  ];
  for (const n of data.notices.slice(0, 150)) {
    if (results.length >= limit) break;
    const id = String(n["publication-number"] ?? "").trim();
    if (!/^\d{5,7}-20\d{2}$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    const titles = n["notice-title"] ?? {};
    const title = typeof titles.eng === "string" ? titles.eng.trim() :
      Array.isArray(titles.eng) ? String(titles.eng[0] ?? "").trim() : "";
    // Never pretend a Dutch / Finnish original title has been translated.
    if (!title || title.length < 20) continue;
    const country = title.split(/\s+[–—-]\s+/)[0].trim().toLowerCase();
    if (!approvedMarkets.has(country)) continue;
    const dateStr = String(n["publication-date"] ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
    const published = new Date(dateStr + "T00:00:00.000Z");
    if (Number.isNaN(published.valueOf()) || published.valueOf() > now.valueOf() + 86400000 ||
        now.valueOf() - published.valueOf() > 15 * 86400000) continue;
    const cpv = Array.isArray(n["classification-cpv"]) ? n["classification-cpv"].map(String) : [];
    const sectorMatch = cpv.some(x => /^72|^7934|^79413/.test(x));
    if (!sectorMatch) continue;
    // A CPV alone isn't enough: the human-readable English title must match an actual service.
    const service = serviceCases.find(([, regex]) => regex.test(title))?.[0];
    if (!service) continue;
    // Exclude unusually complex / restricted work from the small agency pilot.
    if (/\b(gigafactor(y|ies)|critical infrastructure|cyber.defen[cs]e|defen[cs]e forces|national security|hardware supply|licen[cs]e renewal)\b/i.test(title)) continue;
    const names = n["buyer-name"] ?? {};
    const val = names.eng ?? names.nld ?? names.fin ?? Object.values(names)[0];
    const buyer = Array.isArray(val) ? val.map(String).join("; ").slice(0, 180) : typeof val === "string" ? val.slice(0, 180) : "";
    results.push({
      source_key: "TED:" + id,
      source_url: "https://ted.europa.eu/en/notice/-/detail/" + id,
      opportunity_title: title.slice(0, 220),
      opportunity_excerpt: ("Official EU TED notice " + id + "; " + (buyer ? "buyer: " + buyer + "; " : "") + "title only; verify description, eligibility and deadline in original notice.").slice(0, 440),
      publisher: "EU TED",
      service_needed: service,
      published_at: published.toISOString(),
      country: country[0].toUpperCase() + country.slice(1),
      status: "REVIEW_SOURCE_AND_BUYER",
      source_verified: "no",
      buyer_contact_verified: "no",
      draft_message: "",
      outbound_enabled: false
    });
  }
  return {
    candidates: results, blocked: null, review_required: true,
    outbound_enabled: false,
    fetched_count: data.notices.length,
    selected_count: results.length
  };
};
