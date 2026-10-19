/**
 * AS-02 TED request builder for Activepieces Code step.
 * Supply inputs.now (ISO), optional days (1..14).
 * No network action here. Feed the output's url/method/headers/body into an HTTP step.
 */
export const code = async (inputs = {}) => {
  const at = inputs.now ? new Date(inputs.now) : new Date();
  if (Number.isNaN(at.valueOf())) throw new Error("Invalid reference date");
  const days = Math.max(1, Math.min(14, Math.floor(Number(inputs.days) || 7)));
  const first = new Date(at.getTime() - days * 86400000);
  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, "");
  const query = "buyer-country IN (IRL NLD FIN CYP LUX)" +
    " AND notice-type IN (cn-standard cn-social cn-desg)" +
    " AND classification-cpv IN (72000000 79340000 79413000)" +
    " AND PD = (" + ymd(first) + " <> " + ymd(at) + ")";
  return {
    url: "https://api.ted.europa.eu/v3/notices/search",
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: {
      query, fields: ["publication-number", "publication-date", "notice-title",
        "buyer-name", "classification-cpv"], page: 1, limit: 75,
      scope: "ACTIVE", paginationMode: "PAGE_NUMBER"
    },
    source_name: "European Union TED published notices",
    source_authorized: true,
    request_time: at.toISOString(),
    max_candidates: 3
  };
};
