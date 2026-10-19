# AgentSiraji Lead Intelligence V1 — Activepieces Cloud Free

**Status:** Prepared workflow code and source-level tests. This document is the hands-on setup guide. **No live flow has been connected or verified yet.**

## Table: AgentSiraji Prospects (15 fields total)

The user has already created the first 6 fields: `business_name`, `country`, `website`, `source_url`, `verified_need`, `service_needed` (all Text).

Add the remaining **9** fields, in this order:

| Field | Type | Expected value / direction |
| --- | --- | --- |
| `source_verified` | Text | input: yes/no, verified human review of public URL |
| `service_fit_verified` | Text | input: yes/no, AgentSiraji can offer service |
| `buyer_contact_verified` | Text | input: yes/no |
| `opportunity_current` | Text | input: yes/no |
| `do_not_contact` | Text | input: yes/no |
| `duplicate` | Text | input: yes/no (manual until dedup flow) |
| `quality_score` | Number | output from Code |
| `lead_status` | Text | output from Code |
| `draft_message` | Text | output from Code, never sent automatically |

This 15-field pilot is intentionally compact to avoid potential cloud plan field-count restrictions. The `Prospects-columns.csv` is a header reference **not** an import script. Native CSV import may expect preexisting columns. Do **not** import blank/header-only CSV until its behavior is confirmed.

## Build and test AS-01

1. Go to your Activepieces **Personal Project → Automations**.
2. Create a new Flow, named `AS-01 Lead Quality Gate — Human Review`.
3. Trigger: **Tables → New Record Created**, selected table: `AgentSiraji Prospects`.
4. Add a **Code** step named `Lead Quality Gate`. Copy **all** of `score-lead.mjs` into the code editor.
5. Add 12 named inputs. Select the corresponding field values from the Table trigger, not literal field names:
`business_name`, `country`, `website`, `source_url`, `verified_need`, `service_needed`, `source_verified`, `service_fit_verified`, `buyer_contact_verified`, `opportunity_current`, `do_not_contact`, `duplicate`.
6. Add **Tables → Update Record**; select the original Table and **trigger Record ID**. Update exactly these 3 columns from Code outputs: `quality_score`, `lead_status`, `draft_message`. Never insert a second row here.
7. Use **Test** to check that no external messaging, contact, HTTP, payment or social action exists. The only action is updating this internal Table.
8. After completing end-to-end test (and credit check), enable the flow on the Free plan.

The trigger must be **New Record Created** rather than **Record Updated** to prevent a self-triggering loop.

## Fictional test record (never use as a real prospect)

- business_name: `TEST Example Merchant`
- country: `Ireland`
- website: `https://example.org`
- source_url: `https://example.org/news`
- verified_need: `We are looking for a new booking website for our storefront.`
- service_needed: `website development`
- source_verified: `yes` (this is explicitly fictional data)
- service_fit_verified: `yes`
- buyer_contact_verified: `yes`
- opportunity_current: `yes`
- do_not_contact: `no`
- duplicate: `no`

Expected: `quality_score=100`, `lead_status=READY_FOR_HUMAN_REVIEW`, `draft_message` populated. **No email or DM is sent.** Remove the test record after passing.

## Gate cases

- `source_verified=no` → `RESEARCH_MORE`, no draft.
- `do_not_contact=yes` → `DO_NOT_CONTACT`, no draft.
- `duplicate=yes` → `DUPLICATE_REVIEW`, no draft.
- Any missing business name or unverifiable need → `RESEARCH_MORE`.
- 100 points only when all five positive factors have source evidence; the score is rules-based, not a probability.

## Results-driven extension (future, not enabled)

Create a second `AgentSiraji Outcomes` Table **after V1 passes** to record approved contact, replies, meetings, proposals, client wins, collected revenue, and improvement decisions. A separate authorized sourcing pipeline will add real prospects from public permissible sources only. A feedback review can use conversion outcomes to recommend updating the scoring formula and target markets; never auto-edit live workflows or autonomously send cold messages.

## Security and budgets

- Never enter a password or access token in a Table, GitHub or ChatGPT.
- No company/office job automation, no 2TBR customer data, no local software installation.
- Do not connect paid providers without explicit user authorization.
- Treat approvals, anti-spam laws, deduplication and allowed data sources as hard gates.
- Activepieces Cloud plan and credits may change; check the user's current Billing view.

Source code: `score-lead.mjs`; 10 tests: `test-score.mjs`.
