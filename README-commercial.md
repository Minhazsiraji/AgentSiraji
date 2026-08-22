# AgentSiraji Commercial Foundation V1

This branch establishes AgentSiraji as the parent commercial platform for Commerce and future products.

## Product status

- AgentSiraji Commerce — Available now
- AgentSiraji LeadPilot — Coming soon
- AgentSiraji AdIntel — Coming soon
- Doctor's Diary — AgentSiraji Labs / private development / not for public sale

## Commercial architecture

The commercial layer is product-agnostic and supports accounts, organizations, products, plans, prices, subscriptions, payments, invoices, entitlements, onboarding, and audit history.

Payment providers are treated as adapters rather than hard-coded product logic:

- Bangladesh online: SSLCOMMERZ
- Bangladesh manual B2B: bank transfer with admin approval
- International subscription: Paddle
- International larger B2B: manual invoice / Payoneer or bank transfer

## Activation rules

- Browser redirects never activate a subscription.
- Uploaded bank-transfer proof never activates a subscription.
- SSLCOMMERZ and Paddle require verified server-side payment events.
- Bangladesh manual bank transfer requires authorized AgentSiraji admin approval after receipt verification.
- Manual international invoice requires authorized AgentSiraji verification.
- Entitlements activate only after a verified paid state.

## Current mode

The website and payment routes are in launch-preparation/test mode. No production credentials are stored in the repository. `.env.example` documents the required environment variables only.

## Database

A dedicated Neon project named `agentsiraji-commercial` contains the commercial schema. It is intentionally separate from the SirajiBD / Commerce product database.

## Next credential-gated work

When credentials are supplied:

1. Connect the application to the commercial database using a supported Postgres driver.
2. Create real SSLCOMMERZ sandbox sessions and perform server-side validation.
3. Verify Paddle webhook signatures and create sandbox subscriptions.
4. Add real Bangladesh business bank details to the manual-transfer flow.
5. Persist checkout, payment, invoice, subscription, entitlement, and onboarding records.
6. Add authenticated AgentSiraji admin approval UI for manual payments.
7. Run end-to-end sandbox payment tests before enabling any live money.
