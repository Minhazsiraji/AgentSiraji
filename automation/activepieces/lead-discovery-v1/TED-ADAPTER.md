# AS-02 — EU TED intake adapter (prepared 19 October 2026)

**Offline qualification + LIVE PUBLIC API read passed. No Activepieces deployment performed in Chat mode.** Existing AS-02 draft is at:
https://cloud.activepieces.com/projects/EPbVcbjT9Fhoqm6ytxo23/flows/KFAufR0cuFGbi8ZGkoJCe

We queried the official anonymous TED v3 search endpoint (HTTP 200) on 19 Oct 2026 from the online authorized device. Query for preferred markets, relevant CPV codes, active contract notice types and 12–19 Oct returned **85 notices**, many irrelevant; therefore keep cautious English title and CPV filters. Source details: https://docs.ted.europa.eu/api/latest/search.html and https://ted.europa.eu/en/help/search-browse .

## Recommended flow (keep manual trigger until tests pass)

1. Existing **Manual trigger**.
2. **Code — Build TED request**. Paste `ted-request.mjs`, input `now` from current timestamp (optional; defaults to now), `days=7`. Output official URL, method POST, JSON headers, `body.query`, fields, max 75 results.
3. **HTTP Request** to `https://api.ted.europa.eu/v3/notices/search`, POST JSON using builder's `body`. No API key or paid external service. Verify actual HTTP 200 and parsed JSON with `notices`.
4. **Code — Normalize**. Paste `ted-normalize.mjs`. Inputs `ted_response` mapped from HTTP response, `source_authorized` from request-builder output, `now`, `max_candidates=3`.
5. **Loop Over Candidates** (max 3). Add a **Tables → Find Records** operation against the existing `AgentSiraji Discovery Queue` where **source_url equals candidate.source_url**. Do not use contains. If one or more found, skip; if none, **Tables → Create Record(s)**, mapping existing columns: `opportunity_title`, `opportunity_excerpt`, `source_url`, `publisher`, `service_needed`, `published_at`, `status`. If the queue has `source_key`, also map that stable TED publication ID. Do not overwrite approved records.
6. **Review queue only**; candidates are not verified clients and do not enter Prospects/AS-01 automatically. No emails, DMs, paid actions, Ads or published social posts.

### Critical safety and reliability checks
- Test on *the same real payload twice*, not two separately fetched feeds. Assert exactly **one** queue row per canonical `source_url`.
- Find-then-create is not an atomic database unique constraint; keep AS-02 single-run/sequential with no overlapping executions and manually review duplicates. If concurrency is introduced, use a backend with a unique key/idempotent insert.
- Test negative inputs: blocked source, no English title, irrelevant buyer, stale notice, duplicate ID, excluded countries; never send or approve automatically.
- Confirm Activepieces Free credits before/after each run. The live flow is **AS-01 only** until AS-02 tests pass.
- Only add fields when confirmed necessary; do not change the 15-column Prospects schema.
- GDPR / procurement terms apply; do not capture private personal contacts; check closing date and eligibility from the notice before outreach.

## Report of completion requires
- Source reference and real-run HTTP 200
- First run queue row ID
- Second run *same notice* skipped, no new row
- End-to-end run IDs, credit balance
- Confirm AS-01 unaffected and no send actions
- User authorizes AS-02 publication only after all checks pass

### Limitations
The first source is EU government procurement; many bids are unsuitable for a new small digital agency. Titles are only a triage signal, not proof of service fit or buyer permission. Improve sourcing diversity later using separately vetted public sources for small private businesses.
