# AgentSiraji browser Pixel release

Pixel/dataset: `1054067190449122`. The public configuration endpoint supplies this ID when deployment settings are absent. Tokens stay on the server.

The root layout mounts one consent-aware Pixel component. Choosing **Allow measurement** enables PageView on navigation and ViewContent on pricing, Commerce and Store Audit pages. Browser `eventID` matches the corresponding CAPI `event_id`. Declining optional measurement stops event forwarding. Do not install another inline PageView snippet.

The integration settings page is `/admin/integrations`. Its authenticated API stores encrypted credentials using the deployment's `INTEGRATIONS_ADMIN_TOKEN`, `INTEGRATION_ENCRYPTION_KEY` and dedicated AgentSiraji database. Configure the CAPI token and real Meta Test Events code here. Browser installation alone does not establish CAPI delivery.

This release contains no checkout, bKash, payment-webhook or lead-submission changes. Those remain in the separate local funnel implementation. It never emits a Purchase event.

Validation: six Meta regression tests, lint, TypeScript and a build with `VERCEL_ENV=production` passed on 12 September 2026. Tests cover matching browser/server event IDs, consent withdrawal, request origins, rejected fabricated conversions, public Pixel fallback and secret exclusion. Provider boundaries are mocked; live verification is separate.

After deployment, open the website and allow measurement. Check Browser and Server events in the AgentSiraji dataset's Test Events page and compare their event IDs. Setup percentages are not evidence of deduplication. Google ID validation in the integration center is format-only and does not install or verify Google Analytics.
