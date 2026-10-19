# AgentSiraji — Lead Intelligence V1 (Activepieces Cloud Free)

**Status:** Code completed, local automated tests required before release, NOT connected to a live Activepieces account. No paid API or connected CRM required. This pilot is intentionally review-only: it does not browse public websites, find leads automatically, send email/DM, or auto-publish.

## 1. Create and secure the cloud account (owner action)
1. Open https://cloud.activepieces.com/ and create/sign in to the **Free** account. Do not select a paid plan.
2. In Activepieces, create a workspace/project named `AgentSiraji Business OS` where that option is available.
3. Enable account MFA if offered. Never share a password, API token or OAuth access token in chat or GitHub.
4. Create a **Tables** table named `AgentSiraji Prospects`. Use the header names in `Prospects-columns.csv`. For fastest onboarding you may add fields in the UI. Use Text fields except checkboxes/boolean fields, numeric `quality_score`/`revenue_amount`, and date `follow_up_due`/`reviewed_at` as supported.
5. Add a **single fictional test record** first (see below).

## 2. Build flow (no AI model or API charges)
1. In **Flows → New Flow**, name it `AS-01 Qualify prospect → Human review`.
2. Trigger **Tables → New Record Created**, select `AgentSiraji Prospects`.
3. Add **Code** action named `Lead Quality Gate`. Paste all of `score-lead.mjs` into its Code editor (supports `export const code = async (inputs) => { ... }`).
4. In its **Inputs** tab define the following 12 input names, mapped by the field picker from the Table trigger, not typed placeholder strings:
   `business_name`, `country`, `website`, `source_url`,
   `verified_need`, `service_needed`, `source_verified`,
   `service_fit_verified`, `buyer_contact_verified`,
   `opportunity_current`, `do_not_contact`, `duplicate`.
5. Add **Tables → Update Record** for the **same trigger record ID**, not a new record. Map Code output values to fields:
   `lead_key`, `quality_score`, `lead_status`, `reason_codes`,
   `draft_subject`, `draft_message`, `contact_policy`,
   `scoring_version`.
   The trigger must stay **New Record Created**, NOT Record Updated, to prevent an update loop.
6. Optional: notify yourself about `READY_FOR_HUMAN_REVIEW`, but do not add Gmail Send Email, Messenger, WhatsApp, HTTP outreach, or automatic posting.
7. Test the code step on the example below, check score/status in the Table, then publish/enable the flow if the run succeeds and no paid upgrade is requested.

**Important:** The flow is deterministic, not a free autonomous web researcher. Qualified real prospect details must be entered via permitted/public research. Later, a separate approved intake workflow can automate allowed sources and deduplicate before inserting rows.

## 3. Example test record — FICTIONAL, DO NOT CONTACT

- business_name: `TEST Example Merchant`
- country: `Ireland`
- website: `https://example.org`
- source_url: `https://example.org/news`
- verified_need: `We are looking for a new booking website for our storefront.`
- service_needed: `website development`
- source_verified: `yes` (fake for testing only)
- service_fit_verified: `yes`
- buyer_contact_verified: `yes`
- opportunity_current: `yes`
- do_not_contact: `no`
- duplicate: `no`

Expected output: **100 points**, `READY_FOR_HUMAN_REVIEW`, subject and draft created; **no message sent**.
After test, delete the fictional row; never treat the example URL as real evidence.

## 4. Verification / quality gates
- All 10 offline tests pass with `node --test test-score.mjs`.
- A real but unverified lead remains `RESEARCH_MORE`.
- A lead flagged `do_not_contact` becomes `DO_NOT_CONTACT`, and no draft is generated.
- Same business/website flags as duplicate after human or future database deduplication. The code's `lead_key` is only an aid; **it does not query prior records automatically**.
- Only the table's owner can manually review and approve outbound actions in a separate later workflow.
- No outbound actions exist in V1; messaging requires a future explicit consent/compliance-approved release.
- Credit usage under the Free allowance; review actual quota under Billing.
- Add outcome fields `reply_status`, `meeting_booked`, `client_won`, `revenue_amount` after real engagement to measure conversion, not raw outreach volume.

## 5. Results-driven feedback loop (design, not activated)
Daily decisions are written back to the same table. Weekly report on **verified leads → human-approved messages → positive replies → meetings → won deals**, plus time saved and credits used. Suggested targeting adjustments are presented for review; no autonomous modification of production workflows.

## 6. Constraints
- No office-job automation, and no local Windows installation.
- Never copy 2TBR production data, credentials, or customer information into this pilot.
- No scraping protected websites or sending unsolicited automated DMs.
- Do not claim the system can learn from activity until feedback/outcomes are actually recorded and evaluated.
- Activepieces cloud plan/credits may change: check https://www.activepieces.com/pricing.
- These instructions and step code are a prepared implementation; they are **not proof of live deployment**.

## Existing business systems
A separately existing `Minhazsiraji/AgentSiraji-LeadPilot` app already implements lead qualification and follow-up for configurable customer organizations. Do not merge unrelated CRM data. A future authenticated, rate-limited API bridge can connect it after testing.
