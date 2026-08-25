# AgentSiraji Commercial Foundation

AgentSiraji Commerce is the first sellable product in the AgentSiraji product system.

## Current release state

Payment Foundation V1 is complete in sandbox and the branch is in final release-readiness hardening.

### Verified sandbox flows

- SSLCOMMERZ success and cancel flows.
- Paddle Starter, Growth, and Pro checkout flows.
- Paddle webhook replay/idempotency handling.
- Bangladesh manual bank payment submission.
- Manual payment approve, reject, and needs-information review paths.
- Post-payment Commerce customer account/status preview.

### Commercial UX already present

- Commerce pricing and checkout pages.
- Commerce product page and homepage/product CTAs.
- Post-payment customer account/status page.
- Internal manual-payment review UI.
- Privacy, Terms, and Refund & Cancellation pages.
- Contact form product choices aligned to the current product lineup.

## Production safety gates

Production money movement remains intentionally disabled until the final commercial go-live tranche.

- `COMMERCIAL_LIVE_CHECKOUT_ENABLED=false` keeps production Commerce checkout closed.
- `COMMERCIAL_ACCOUNT_PREVIEW_ENABLED=false` keeps transaction-reference account lookup closed in production until customer authentication replaces the preview boundary.
- SSLCOMMERZ is restricted to sandbox mode in the current integration.
- Paddle is restricted to sandbox mode in the current integration.
- Manual payment approval requires a server-only admin review token.
- Manual payment proof never activates service by itself; only an authorized approval can activate the corresponding entitlement.

## Security and hardening completed

- Checkout/API error sanitization.
- `no-store` / private cache controls on sensitive responses.
- JSON content-type, request-size, and same-origin validation on commercial write endpoints.
- Manual payment input validation.
- HTTPS-only proof URL validation.
- Constant-time admin token comparison.
- Browser input cannot spoof the authoritative reviewer account identity.
- Manual-payment admin UI requires an explicit review decision and does not default to approval.
- Security headers include CSP, HSTS, clickjacking protection, referrer policy, permissions policy, and MIME sniffing protection.

## SEO and indexing

- Production metadata, sitemap, and robots configuration are present.
- Preview environments are `noindex` / `nofollow`.
- Sensitive operational/account/checkout paths are excluded from production crawling.

## Automated quality gate

`.github/workflows/release-readiness.yml` runs on the commercial branch, pull requests, and `main` and requires:

1. frozen-lockfile install
2. lint
3. TypeScript typecheck
4. production build

## Intentionally deferred before commercial go-live

These are not to be implemented with placeholder identities or credentials:

1. Customer authentication and authenticated Commerce account ownership.
2. Production SSLCOMMERZ merchant credentials and live endpoints.
3. Production Paddle credentials/catalog and live environment.
4. Final AgentSiraji legal/business identity and legal-page particulars.
5. Final Bangladesh business bank details and international receiving instructions.
6. Explicit commercial go-live acceptance before enabling the production checkout gate.

## Release rule

Do not enable `COMMERCIAL_LIVE_CHECKOUT_ENABLED` or `COMMERCIAL_ACCOUNT_PREVIEW_ENABLED` in production until the corresponding deferred production controls are complete and verified.
