# AgentSiraji AS-02 — Source-Gated Opportunity Discovery

**State:** Source and tests prepared, NOT deployed. Use as a draft in Activepieces Cloud Free after AS-01 qualification is published and enabled.

## Purpose

Find *candidate* business requests from **authorized public RSS feeds or official procurement feeds**, not scrape personal profiles or imply a company wants a service without evidence. A real opportunity still requires the user to review the original posting, verify buyer identity and deduplicate before it enters AgentSiraji Prospects.

## Proposed limited-cost Activepieces workflow

1. Create a separate Table called `AgentSiraji Discovery Queue` with text columns: `opportunity_title`, `opportunity_excerpt`, `source_url`, `publisher`, `service_needed`, `published_at`, `status`.
2. Trigger a daily schedule, or better a manual trigger initially.
3. Use an authorized RSS/feed reader step for ONE source controlled by a verified publisher or public procurement body. Use no LinkedIn scraping, Meta account scraping, or DMs.
4. Map feed items as `items`, explicit `source_authorized: true` only after confirming feed terms, `source_label`, `country`, and `now` into a Code step. Paste `curate-candidates.mjs`.
5. Result: `candidates` array of up to 3 by default, with `source_verified=no`, `status=REVIEW_SOURCE_AND_BUYER`, no draft and `outbound_enabled=false`.
6. To insert candidates, use a loop over `candidates` and a Table lookup for `source_url` to prevent duplicates **before** create. Keep flow unpublished until the lookup/loop and one complete in-cloud run are confirmed. Limit total daily operations to stay under Free credits.
7. Human reviewer opens each source URL and verifies actual request, the buyer, the current need, legitimacy, and contact permission. Only then create a record in `AgentSiraji Prospects` with the correct evidence flags. AS-01 handles final scoring/drafting.
8. Track manually reviewed candidates and their conversion to approved leads; add learnings after enough outcomes accumulate.

**This code does not fetch a URL and cannot verify sources.** It curates pre-fetched structured items; nothing autonomously sends messages, changes production workflows or purchases services.

## Acceptance
- [ ] AS-01 confirmed published/enabled with no outbound connector.
- [ ] Approved public source chosen and reviewed for permitted use.
- [ ] Feed output fields mapped to Code inputs and one manual Activepieces execution passes.
- [ ] Table duplication check verified on two runs of the same item.
- [ ] Credit use and rate-limits checked.
- [ ] User explicitly approves enabling the new discovery flow.
