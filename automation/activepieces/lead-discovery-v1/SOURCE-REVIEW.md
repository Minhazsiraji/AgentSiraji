# AS-02 — Approved-source candidates and go-live gates (19 October 2026)

AS-01 is reported **published and enabled** in Activepieces with live fictional-record run https://cloud.activepieces.com/projects/EPbVcbjT9Fhoqm6ytxo23/runs/8oNpkVBdN6ABcMAZWaLDc . User reports 100 score, READY_FOR_HUMAN_REVIEW, draft saved to same record and no messaging actions. This status is based on the user's Work-mode execution report; not independently verified through Activepieces API in this chat.

AS-02 is a separate **unpublished** flow:
https://cloud.activepieces.com/projects/EPbVcbjT9Fhoqm6ytxo23/flows/KFAufR0cuFGbi8ZGkoJCe

## Candidate legitimate sources — documented, NOT yet validated in Activepieces

| Priority | Source | Programmatic method | Verification / limitation |
| --- | --- | --- | --- |
| 1 | EU Tenders Electronic Daily (TED) | Official search API, `POST /v3/notices/search` | Published notices can be searched anonymously; see https://docs.ted.europa.eu/api/latest/search.html . Select relevant CPV and date/region filters, inspect structured response. **Our existing code is RSS-style and needs an explicit TED-to-items adapter**. |
| 2 | Netherlands TenderNed | Official public notices feed `https://www.tenderned.nl/papi/tenderned-rs-tns/rss/laatste-publicatie.rss` | Public open procurement notices, official Netherlands government open data listing https://data.overheid.nl/dataset/aankondigingen-van-overheidsopdrachten---tenderned (CC0). Endpoint serves Atom/XML; confirm Activepieces feed reader supports Atom and map fields. **Current candidate scorer has English-only phrases; Dutch text needs localized processing and testing.** |
| 3 | Finland HILMA | Official AVP Read API | Free for commercial use, but self-registration and API key are required; documented at https://hns-hilma-prod-apim.developer.azure-api.net/ . Observe rate limit and protect key in encrypted credentials. |
| 4 | UK Contracts Finder | Official OCDS JSON notices API | Documented at https://www.contractsfinder.service.gov.uk/apidocumentation . Open procurement notices; UK isn't in the user's preferred initial overseas focus, so this is an optional fallback. |

These sources publish **procurement opportunities**, not permission to send unsolicited communications. Check eligibility (including if foreign suppliers can bid), deadlines, budget, contact policy, and actual relevant digital-service scope. Government tenders are often larger or unsuitable for a small new agency. Do not represent them as confirmed clients. Do not confuse lead discovery with anonymous scraping or email harvesting.

## Input reliability and technical work still required
- [ ] Select **one** source first; manually verify public read rights and that the Activepieces HTTP/RSS step works without upgrade.
- [ ] Map format to {title,description,link,pubDate} before calling the current `curate-candidates.mjs`. Do not force `source_authorized=true` merely because a page is public.
- [ ] For Dutch or non-English sources, expand localization with tests before enabling.
- [ ] Add persisted `source_key` field to Discovery Queue (use stable notice ID or canonical source URL). Configure **Search Records** before **Create Record**; skip if found. Have a secondary manual duplicate check for similar company or notices. Batch-local `Set` alone is insufficient.
- [ ] Perform two repeated ingestion test runs with the same source data and prove exactly **one** queue record.
- [ ] Run negative tests: missing evidence, stale notice, non-digital procurement, expired deadline, blocked/no-contact; no prospect auto-approval.
- [ ] Gate any queue-to-Prospects copy behind human review and verified buyer/service need; AS-01 may score but does **not** contact.
- [ ] Record free credits before/after a tiny test; add hard cap on intake items. Publish AS-02 **only after** owner approves tested run and no paid integrations.
- [ ] Use official RSS or API rather than scraping LinkedIn, FB personal profiles, private portals or search result pages.

## What success means
At least one bona fide **suitable** real opportunity is reviewed with correct source/deadline, appears once in Discovery Queue, and (if approved) becomes one verified Prospects record scored by live AS-01. Later track replies, meetings, proposals and won client revenue with real consent/compliance.
