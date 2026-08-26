# AgentSiraji Commerce — Go-Live Checklist

This checklist starts after Commercial Foundation V1 / sandbox acceptance is complete. It deliberately keeps production checkout and production transaction-based account preview disabled until every required go-live item is approved.

## Already complete

- [x] Commerce product, pricing, checkout, legal-policy, contact, FAQ, account-preview, SEO, robots, sitemap, and commercial UI foundation.
- [x] Dedicated commercial database and persistent payment/subscription/entitlement state.
- [x] SSLCOMMERZ sandbox checkout and server-side validation tested.
- [x] Paddle Starter, Growth, and Pro sandbox checkout tested.
- [x] Paddle webhook signature verification and replay/idempotency tested.
- [x] Manual bank/invoice submission and approve/reject/needs-information paths tested.
- [x] Production checkout gate exists and defaults closed.
- [x] Production transaction-based account-preview gate exists and defaults closed.
- [x] Admin review console is not exposed in production before authenticated admin access exists.
- [x] Release Readiness CI and Vercel preview deployment are green for the commercial-foundation branch.

## Requires owner/external-account input before live selling

- [ ] Confirm final legal/business trading identity and customer-facing legal particulars.
- [ ] Confirm Bangladesh business receiving/bank details.
- [ ] Confirm international receiving details where manual invoice/payment is offered.
- [ ] Obtain and configure live SSLCOMMERZ merchant credentials and production endpoints.
- [ ] Obtain and configure live Paddle account/catalog/client/API/webhook credentials.
- [ ] Confirm final production prices, taxes/fees treatment, currencies, and refund/cancellation wording against provider/business requirements.

## Customer and admin access before activation

- [ ] Implement production customer authentication and authorization for Commerce account data.
- [ ] Replace transaction-reference account preview as the production access boundary.
- [ ] Implement authenticated owner/admin access for manual-payment review and operational tools.
- [ ] Verify account isolation: one customer/organization cannot read another customer's payment, subscription, or entitlement state.
- [ ] Verify secure session, sign-out, reset/recovery, and account-access error flows.

## Production payment conversion

- [ ] Switch SSLCOMMERZ integration from sandbox-only configuration to explicit environment-aware sandbox/live configuration.
- [ ] Switch Paddle integration from sandbox-only catalog/environment to explicit environment-aware sandbox/live configuration.
- [ ] Verify production callback/webhook URLs, signature/validation paths, amount/currency/reference checks, and replay protection.
- [ ] Keep live checkout disabled while production credentials are being configured and tested.
- [ ] Run low-risk controlled live-money acceptance transactions for each enabled provider and plan.
- [ ] Verify successful payment activates exactly one intended subscription/entitlement.
- [ ] Verify failed/cancelled payments never activate service.
- [ ] Verify duplicate/replayed callbacks never create duplicate activation or charges in AgentSiraji state.
- [ ] Verify refund/cancellation/subscription lifecycle behavior and operational handling.

## Production operations

- [ ] Configure production support/contact destination and verified sending domain.
- [ ] Confirm monitoring/log access for checkout, payment webhooks, database failures, and contact delivery.
- [ ] Document payment reconciliation process for SSLCOMMERZ, Paddle, bank transfer, and manual invoice paths.
- [ ] Document manual-payment review authority and evidence-retention process.
- [ ] Document customer onboarding handoff after entitlement becomes active.
- [ ] Define incident response: disable live checkout first if payment integrity or activation is uncertain.
- [ ] Confirm database backup/recovery expectations and operational ownership.

## Final release gate

Do not set either production gate to true until the relevant prerequisites above are complete and a final go-live review is recorded.

- [ ] `COMMERCIAL_ACCOUNT_PREVIEW_ENABLED=true` only after production customer authentication fully protects account data. Prefer replacing this preview gate with the authenticated customer-account path rather than relying on transaction references.
- [ ] `COMMERCIAL_LIVE_CHECKOUT_ENABLED=true` only after legal/business identity, live provider credentials/configuration, receiving details, production payment acceptance tests, and operational readiness are complete.
- [ ] Confirm production Vercel deployment is green.
- [ ] Confirm GitHub Release Readiness is green on the exact production commit.
- [ ] Record the production release commit/tag and the date live selling was enabled.

## Rollback rule

If any uncertainty exists around payment verification, duplicate activation, account authorization, or provider configuration, keep or return `COMMERCIAL_LIVE_CHECKOUT_ENABLED` to false and investigate before accepting additional live payments.
