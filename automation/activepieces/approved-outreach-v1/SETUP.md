# AgentSiraji AS-05 — Owner-approved Outreach and Follow-up

**Status: source code prepared and locally tested (20 cases); cloud integration NOT BUILT / NOT PUBLISHED.** Branch `feat/agentsiraji-as05-approved-outreach-v1` remains independent of the existing AS-01/AS-02 cloud flows.

## Workflow boundary

- **Input:** Four daily researched leads from the existing ChatGPT "Direct Outreach foreign client" / "AgentSiraji Daily Leads" task (2 foreign, 2 BD). **The automation output does not automatically arrive in Activepieces.** Transfer selected lead records manually through ChatGPT Work pending a supported official integration.
- **Qualification:** `as05-engine.mjs` action `qualify`. A source/business selling products without explicitly requesting a developer is **RESEARCH_ONLY**, not buyer-verified, and is blocked from assisted submission. Prioritize explicit job/request posts.
- **Message preparation:** ChatGPT prepares a specific direct proposal or DM, but must not promise unsupported Shopify references, company age, trade-licence completion, guaranteed results, or fixed pricing without checking scope.
- **Human approval:** OWNER explicitly approves **one exact lead ID, channel, verified recipient URL, and full message body**. Store time-limited approval (≤48 h) and approval ID. No blanket approval or interpreting "continue" as permission.
- **Supervised handoff:** `as05-engine.mjs` action `handoff` only returns `AWAITING_PLATFORM_SUBMISSION`. **It never sends.** Before any Work/connector browser action, perform persistent submission lookup; fail closed on lookup errors. Work may submit that exact approved message through a currently signed-in **supported and platform-permitted** account, only when there is evidence that the action actually works. If unsupported, present copy-ready message and official link, then record as WAITING_MANUAL_SEND.
- **Record outcome:** `record_outcome` requires a real platform confirmation / user-confirmed observed receipt to mark SENT, and actual reply evidence to mark REPLIED. A Work tool click, queued message or generic success banner is not automatically proof of delivery.
- **Follow-ups:** `due_followups` produces an OWNER_REVIEW_FOLLOWUP_ONLY list for previously sent, nonresponding records with an owner-approved due date. Never auto-follow-up or send, and stop on reply, DO_NOT_CONTACT, WON or LOST.
- **AS-01 / AS-02:** Never edit their flows or tables. Only an independently qualified lead may be copied to AS-01 Prospects after explicit review; AS-02 remains Manual Trigger.

## Data storage: new separate tables only (private Activepieces project)

Create **AgentSiraji Outreach Leads** fields (types as supported):
`lead_id` text, `business_name` text, `country` text, `source_url` text,
`recipient_url` text, `channel` text, `buyer_need` text,
`last_verified_at` text/ISO, `verification_json` long text,
`status` text, `draft_text` long text, `sent_at` ISO, `reply_at` ISO,
`follow_up_due_at` ISO, `last_event_id` text, `notes` long text.

Create **AgentSiraji Outreach Approvals** fields:
`approval_id`, `lead_id`, `decision`, `approved_by`, `channel`,
`recipient_url`, `approved_text`, `approved_at`, `expires_at`, `status`.
All approvals must originate from the user's actual named message or trusted approval screen, not from lead or AI draft data.

Create **AgentSiraji Outreach Events** (append-only where possible):
`event_id`, `lead_id`, `type`, `actor`, `occurred_at`, `approval_id`,
`platform_receipt`, `observed_reply`, `follow_up_due_at`, `notes`.
Do not log session tokens or private messaging cookies.

### Persistence / idempotency

1. For each lead, normalize the official source URL and assign a stable `lead_id`. Search existing Outreach Leads before create.
2. Before handoff, Tables Find Records by **exact lead_id + recipient_url + approval_id** in Approvals and by approved lead in Events; if lookup cannot be completed, **do not send**.
3. Insert one "SUBMISSION_PENDING" attempt before opening the platform composer, so a retry never silently sends twice. Require an operator to reconcile uncertain send results. Never run overlapping send actions.
4. After confirmed send, append a uniquely identified event and update the related lead. Before every event write, lookup `event_id`; refuse repeat.
5. Activepieces find-then-create is **not an atomic uniqueness constraint**. Permit at most one sequential run, no concurrent sending, and add an atomic datastore unique key before any future multi-worker execution.

### Suggested future Activepieces pieces (not yet configured)

- AS-05A **Manual Lead Intake**: optional manual trigger; verify four daily leads; Code `qualify`; write research-only vs review-ready rows; no outbound steps.
- AS-05B **Manual Approved Submission**: user-selected lead + exact message approval → Code `handoff` → **stop and hand off to ChatGPT Work**. Do not add an HTTP/Meta/LinkedIn/Freelancer send action without checking officially supported permissions and distinct owner approval.
- AS-05C **Outcome Ledger**: verified human/platform event → Code `record_outcome` → Events + update Leads. Manual trigger initially.
- AS-05D **Follow-up Dashboard**: Code `due_followups` produces due records; no sender connected. Can later notify owner after explicit schedule approval.

## Channel capability gate

**No verified sending integration is currently connected** for LinkedIn DMs, Facebook Messenger, WhatsApp Business, Freelancer.com bids, or Freelancer.nl proposals. The available Metricool connection concerns social publishing/analytics and is **not evidence** of DM capability. Connected browser Work mode might allow specific logged-in platform operations, but only after a real session, supported controls, platform rules and individually approved exact messages are verified. Never collect session cookies, automate scraping, spoof accounts, bypass fees/CAPTCHA, or send a proposal outside the platform's authorized route.

## Registration / honesty

AgentSiraji is a new founder-led startup with trade licence **submission planned for 15 November 2026**, not yet issued. Demonstrations may evidence technical capability, but are not paid Shopify client case studies. Verify local law, platform account eligibility and payment terms before accepting a contract.

## Acceptance test plan

Run `node --test automation/activepieces/approved-outreach-v1/test-as05-engine.mjs`. The local version passed **20/20** on 21 October. Before cloud activation, re-run exact checked-in code and repeat cloud tests:
- source stale, fake host, unavailable buyer, no explicit service request, DO_NOT_CONTACT, prior contact
- missing approval, approval body/recipient mismatch, expired approval, repeated submission
- no platform send receipt → not SENT; no observed reply → not REPLIED
- owner-approved follow-up due only, never auto-sent
- two sequential runs with identical submitted message produce **one**, not two, events
- ensure 0 new charges, 0 unapproved messages, and no writes to AS-01/AS-02
- obtain owner's approval to publish only after completed cloud evidence

**The 12-lead spreadsheet in this ChatGPT conversation is an offline intake reference, not a cloud-imported or approved sending batch.**