# AS-06 — Multi-brand Facebook & YouTube Channel Registry (Draft)

**Owner direction (21 Oct 2026):** Manage **both** AgentSiraji business channels and Habibi creator channels, **also** the personal YouTube channel named **Minhaz Siraji**, and additional owner-controlled Facebook Pages. Inventory first; channel connection and publishing require separate owner confirmation.

## Source-aware destination inventory

| Workspace / identity | Network | Destination reported | Exact URL / ID (if independently available) | Connection evidence | Status |
| --- | --- | --- | --- | --- | --- |
| AgentSiraji studio | Facebook Page | AgentSiraji (owner previously reported) | **Not supplied** | No page-specific connection evidence | OWNER-REPORTED; NEED_URL_AND_PERMISSION |
| AgentSiraji studio | YouTube | AgentSiraji channel if one exists | **Not supplied** | No channel connected in Metricool | UNCONFIRMED |
| It's Habibi Style | YouTube | It's Habibi Style | https://www.youtube.com/@itshabibistyle | Previously supplied channel link; not connected in Metricool | LINK_KNOWN; CONNECTION_UNVERIFIED |
| It's Habibi Style | Facebook Page | Habibi creator Page, if any | **Not supplied** | No verified connection | NEED_OWNER_CONFIRMATION |
| Minhaz Siraji (personal creator) | YouTube | Minhaz Siraji | **Exact channel URL/handle not supplied** | No YouTube account connected in Metricool | OWNER-REPORTED; NEED_URL_AND_PERMISSION |
| More owner-controlled Pages | Facebook Page(s) | Names and URLs to be provided | **Not supplied** | Not enumerated by connected data | INVENTORY_PENDING |
| 2-TAKA-R-BAZAR | Facebook Page | 2-TAKA-R-BAZAR | https://www.facebook.com/share/1JJQSAU84c/ (previously supplied share link, not permanent page ID) | A 2TBR FB draft exists in Metricool; connected page identity not proven | SOURCE_LINK_REPORTED; NEED_CANONICAL_PAGE |
| Doctor's Diary | Facebook Page | Doctor's Diary | https://web.facebook.com/diaryofdoctorsDD/ (previously supplied Page link) | No linked publishing account verified | LINK_KNOWN; CONNECTION_UNVERIFIED |
| Metricool brand `minhazsiraji` | Facebook | Unresolved page or account | Provider FB ID `222348314286085` | Metricool getBrandSettings linked this ID on 21 Oct | CONNECTED_IN_METRICOOL; BRAND_ASSOCIATION_UNVERIFIED |
| Metricool brand `minhazsiraji` | Instagram | `minhazsiraji` | Instagram username `minhazsiraji` | Metricool getBrandSettings linked username on 21 Oct | CONNECTED_IN_METRICOOL; BRAND_ASSOCIATION_UNVERIFIED |
| Metricool brand `minhazsiraji` | YouTube | None | n/a | No YouTube connection listed | DISCONNECTED |

This is **not** proof that the owner has authorized posting to any of these destinations. The 2TBR, Doctor's Diary and any extra pages are **inventory candidates**, not silently opted into a publishing schedule. No passwords, tokens, owner email, or account cookies should be committed to GitHub.

## Multi-brand architecture

- Maintain a **Brand Registry** and a separate **Channel Registry**: `brand_id`, `channel_id`, `network`, `canonical_url`, `platform_account_id`, `connection_provider`, `connection_verified_at`, `permission_scope`, `owner_enabled`.
- Content is keyed to one brand and channel: `content_id`, `brand_id`, `asset_refs`, `title`, `caption`, `language`, `format` (FB feed, FB Reel, YouTube Shorts, YouTube long-form), `draft_revision`, `planned_at`, `status`.
- Approval records bind the **specific brand + exact destination + final text + exact media files + scheduled time**, with expiry and any platform-required audience/disclosure settings. Editing anything meaningful invalidates approval.
- Model statuses: `IDEA -> DRAFT -> READY_FOR_REVIEW -> APPROVED -> SCHEDULE_PENDING -> SCHEDULED -> PUBLISHED`; with `REJECTED`, `FAILED`, `NEEDS_REAPPROVAL`. Require actual provider URL/post ID to mark `PUBLISHED`.
- Distinct calendar, brand voice, logo, topics, language and analytics partition for each brand. Do not cross-post between AgentSiraji/Habibi/personal/2TBR/Doctor's Diary without destination-specific approval.
- **Drafting** is not video rendering; **scheduled** is not published; Metricool `draft=true` and `autoPublish=false` is not approval or completed publication.
- Prefer free-tier Activepieces to prepare reviews and state tracking; Metricool only when exact channel connected and supported. Do not use paid review capabilities in the Free plan. YouTube connection uses official OAuth by the owner.
- Never give AS-06 access to AS-01/AS-02/AS-05 prospect data, employer data, 2TBR customer records, or Doctor's Diary patient information.
- Publish **nothing** while this registry is being assembled. No automatic cross-posting, schedule enablement, or credential harvesting.

## Priorities and milestones

1. Obtain exact YouTube channel link for **Minhaz Siraji** and canonical FB Page URLs (all owner-managed pages). Confirm whether AgentSiraji and Habibi Facebook Pages are distinct.
2. In signed-in authenticated Work/Metricool session, verify each channel's *actual page identity* and admin permission; connect YouTube channels only with owner consent; don't infer a match from display label alone.
3. Owner chooses which pages join AS-06 initially. Present an approval matrix for all selected brands and destinations.
4. Implement an isolated **AS-06 content ledger** using Free-plan infrastructure and one channel in read/draft-only mode, test with fictional media. Never change an existing 2TBR FB draft unintentionally.
5. Validate publish route for FB Page and YouTube (media format, captions, disclosure, rights, rate limits, fees, timezone) in supported official connections; no sending without separately approved final asset.
6. After successful sandbox/preview validation and per-destination approval, enable publication one brand/channel at a time; track post links and channel-specific performance.

**Current implementation status:** channel registry and architecture prepared only; **no publishing flow deployed, no YouTube connected, no social post created/scheduled/published** by AS-06.
