# AgentSiraji Commercial Foundation V1

This branch establishes AgentSiraji as the parent commercial platform for Commerce and future products.

## Product status

- AgentSiraji Commerce — commercial foundation ready in sandbox
- AgentSiraji LeadPilot — coming soon
- AgentSiraji AdIntel — coming soon
- Doctor's Diary — AgentSiraji Labs / private development / not for public sale

## Commercial architecture

The commercial layer is product-agnostic and supports accounts, organizations, products, plans, prices, subscriptions, payments, invoices, entitlements, onboarding, and audit history.

Payment providers are treated as adapters rather than hard-coded product logic:

- Bangladesh online: SSLCOMMERZ
- Bangladesh manual B2B: bank transfer with authorized admin approval
- International subscription: Paddle
- International larger B2B: manual invoice / Payoneer or bank transfer

## Activation rules

- Browser redirects never activate a subscription.
- Uploaded or linked payment proof never activates a subscription.
- SSLCOMMERZ requires verified server-side validation.
- Paddle requires a verified signed server webhook.
- Bangladesh manual bank transfer requires authorized AgentSiraji review after independent receipt verification.
- Manual international invoice requires authorized AgentSiraji review.
- Entitlements activate only after a verified paid state.

## Sandbox acceptance status

Completed and verified in the commercial sandbox:

- SSLCOMMERZ successful checkout and server-side activation
- SSLCOMMERZ customer-account redirect
- SSLCOMMERZ cancellation handling without entitlement activation
- Paddle Starter, Growth, and Pro checkout
- Paddle signed webhook activation
- Paddle replay/idempotency without duplicate commercial state
- Manual bank-transfer submission → under review → approval
- Manual bank-transfer rejection without activation
- Manual invoice needs-information state without activation
- Customer-facing Commerce purchase/status preview
- Production safety gates preventing accidental live checkout
- Production safety gate blocking transaction-reference account lookup until authentication exists

## Current safety mode

No production payment credentials belong in the repository. Preview deployments use sandbox providers.

Production checkout is blocked unless `COMMERCIAL_LIVE_CHECKOUT_ENABLED=true` is deliberately configured after go-live acceptance.

Transaction-reference customer account preview is blocked in production unless `COMMERCIAL_ACCOUNT_PREVIEW_ENABLED=true`. The intended production replacement is authenticated customer account access, so this flag should normally remain disabled.

`.env.example` documents required variables without real credentials.

## Database

A dedicated Neon project named `agentsiraji-commercial` contains the commercial schema. It is intentionally separate from the SirajiBD / Commerce product database.

## Deferred production blockers

These items intentionally remain outside the sandbox foundation and must be completed before live money:

1. Real customer authentication and organization-scoped account access.
2. Production AgentSiraji business/legal identity and policy details.
3. Production SSLCOMMERZ merchant credentials and production validation test.
4. Production Paddle account/catalog/webhook credentials and lifecycle test.
5. Real Bangladesh business bank details and operational review ownership.
6. International payout/invoice receiving details where manual B2B payment is offered.
7. Recurring subscription lifecycle: renewal, past-due/payment failure, cancellation, pause/resume, entitlement suspension/revocation.
8. Atomic transaction boundaries for payment/subscription/entitlement activation where required.
9. Final production security, accessibility, responsive, SEO, and operational acceptance.

## Release rule

Do not enable live checkout merely because the branch is deployable. Live money requires explicit commercial go-live acceptance and production credentials for each enabled payment route.
