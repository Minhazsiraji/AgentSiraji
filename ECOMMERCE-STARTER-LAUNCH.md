# AgentSiraji E-commerce Starter — Launch Runbook (17 Nov 2026)

## Offer and channel
- Landing page: https://agentsiraji.com/ecommerce-starter (production ONLY AFTER the PR is tested and merged).
- Positioning: Website + Selling System + Tracking + Automation, not a disposable cheap template.
- One-time standard setup: **BDT 3,000**.
- Domain: actual registrar cost billed to buyer.
- Hosting and technical support: **BDT 2,000/month**, recurring, separate from one-time setup.
- Optional customization outside documented Starter scope: **BDT 2,000 extra**, agreed before implementation.
- Package includes modern mobile-friendly store, products, basic inventory, cart, checkout, COD, order management, supported courier integration, initial Meta Pixel & CAPI, basic customer event tracking, launch support.
- Do not promise fixed delivery timelines, guaranteed sales, unlimited changes, or a fictional regular-price comparison without a documented basis.

## Sales journey
Meta Sales ad → /ecommerce-starter → offer/transparent total costs → starter form → a server-stored PENDING_PAYMENT order → bKash / City Bank transfer instructions → reference and optional HTTPS proof link → PENDING_VERIFICATION → independent admin bank/bKash receipt check → PAID or REJECTED → onboarding WhatsApp → build store.

**Payment security:** The landing page is intentionally in preparation mode unless the server-only environment variable `STARTER_LIVE_PAYMENTS_ENABLED=true` is set. Never enable that switch just to demo payments. Pre-qualify and verify the actual receiving account and transfer instructions. On the landing page, bKash 01404385101 has no confirmed account type; buyers must check the correct way to transfer before sending. City Bank account from previously provided owner details is displayed as 2183503557001, Md. Minhaz Siraji, Ashulia Branch. Do not solicit or store bank passwords, OTPs or PINs.

## Data and review
- Migration: `database/0008_ecommerce_starter.sql` on the existing AgentSiraji commercial Neon project.
- New table `starter_orders` keeps order, contact, attribution, independent payment status, admin verification notes and conversion dispatch status.
- Unique payment-reference index blocks reusing the same reference for one receiving method.
- Private access token is random and only its SHA256 hash is stored. Client status check uses JSON body, not a query URL.
- Existing platform owner/admin session required for `/admin/starter-orders`; only the admin route can mark payment PAID.
- Admin must independently see the transfer on bank/bKash receiving statement, confirm amount = 3000 BDT and record a verification note.
- Proof submission never generates Purchase. No receipt verification implies no onboarding activation.
- Screenshot attachment upload is **not implemented**; an optional HTTPS proof link plus WhatsApp are offered. Do not advertise native screenshot upload before adding secure object storage.

## Meta Pixel + CAPI event map
| Stage | Browser Pixel | Server CAPI | ID | Condition |
|---|---|---|---|---|
| Landing PageView | Yes | Yes | generated PageView ID | existing marketing consent |
| Starter ViewContent | Yes | Yes | generated ViewContent ID | visiting /ecommerce-starter with consent |
| InitiateCheckout | Yes | Yes | same starter_checkout generated UUID | real order saved, consent granted |
| AddPaymentInfo | Not active | Not active | n/a | wait for meaningful, properly consented payment metadata action |
| Contact/Lead | Existing enquiry flows | Existing enquiry flows | existing IDs | accepted Lead/Contact only |
| Purchase | Only on approved customer's secure status check | On admin's verified PAID decision | **as_starter_purchase_<order_id>** | real independent verification, marketing consent |
- Value = 3000; currency = BDT.
- Browser Purchase and server Purchase share exactly the same event_name and event_id. Server retry uses a database claim to avoid concurrent duplicate sends. A repeat after ambiguous upstream response uses the SAME event ID so Meta can deduplicate.
- The public Meta event API still rejects Purchase. Other products' Purchase tracking remains blocked during their pilot.
- Existing consent banner and privacy/measurement policy remain in effect.
- Failed CAPI send is flagged as FAILED; the owner may click retry. `SKIPPED_CONSENT` is a legitimate no-tracking outcome, not a payment failure.
- In Meta Events Manager, confirm Browser + Server paired signals, event IDs, source URL, dedup, and verify that Purchase never appears before PAID. Test event codes are not forwarded in production from this implementation.

## Preflight and gated go-live
1. Confirm the newly added order table exists in the correct connected AgentSiraji database (Neon commercial, not MyCommerce).
2. Finish `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and Vercel preview inspection.
3. Verify bKash **01404385101** receiving account type and correct transfer method; confirm whether it may accept business sales receipts. Keep instructions safe until then.
4. Verify City Bank receiving ability/account details and the operational independent verification procedure.
5. Inspect mobile layout (360px and 390px), typo-free Bangla, footer pricing disclosure, return/refund/privacy references, consent UI and accessibility.
6. On a non-live test environment, create fake order records and test pending→payment-submitted→approved and rejected workflows without sending real money. Then validate live accounts through an authorized low-risk real transfer only if suitable.
7. Check existing Meta Pixel ID, server CAPI token, Meta Test Events and event match quality; remove any production test-event-code configuration.
8. Gate live order submission behind server-only `STARTER_LIVE_PAYMENTS_ENABLED`. Do not enable until explicit acceptance of payment method, support capacity and documentation.
9. Merge the PR only after checks. Production content can display the offer with **checkout disabled** until live acceptance.
10. Meta Ads should start only when both payment verification and full conversion-event flow are tested.

## Meta ad campaign
- Objective: **Sales**; conversion location: **Website**; destination: `https://agentsiraji.com/ecommerce-starter`.
- 1 Bangladesh-focused broad ad set, Advantage+ placements (review placement fit) with 2 creatives (4:5 static, 9:16 motion). Begin around **৳500/day** only after gates pass. Use no fictional urgency or guaranteed results.
- Optimize for Purchase after the event works and sufficient conversions accumulate; in low signal conditions use an explicitly measured valid lower-funnel conversion temporarily, and re-evaluate in Events Manager instead of automatically switching to Traffic.
- Standard UTMs: `utm_source=meta&utm_medium=paid_social&utm_campaign=starter_3000_launch&utm_content=poster_4x5` or `motion_9x16`.
- First 3–5 days focus on LPV, qualified order creation, payment submission and verified sale. Never make decisions from Messenger conversations alone if purchase is the end goal.
- Review: spend, CPM, CTR, landing-page-view rate, ViewContent, created checkouts, payment submitted count, verified Purchases, cost per verified Purchase, refund/cancellation and contribution margin.
- Tracking definition: **Purchase conversion rate = verified purchases / landing-page views** (state denominator). **Cost per Purchase = Meta spend / verified purchases**. **ROAS = 3000 × verified purchases / Meta spend**, not profit.
- Profitability must also deduct per-customer setup labor/implementation cost, hosting/support obligations, domain pass-through treatment, payment fees, tax and ad spend. The **৳2,000/month** support revenue does not justify assuming zero future support costs.
- Retarget only after meaningful audience size; eligible consented audiences: landing visitors, product viewers, checkout abandoners; exclude Purchasers.

## Advertising copy (ready to paste)
### Primary Text
**মাত্র ৳৩,০০০ দিয়ে শুরু করুন আপনার স্বপ্নের E-commerce Business!** 🚀

AgentSiraji আপনাকে দিচ্ছে শুধু Website নয় — একটি আধুনিক, customizable **Online Selling System**।

✅ Professional Mobile-friendly Website
✅ Product, Cart, Checkout এবং COD Order System
✅ Order Management ও Courier Integration
✅ Meta Pixel + Conversion API (CAPI)
✅ Better customer-action tracking foundation

**Better Tracking → Better Data → Smarter Ads.**

**Starter Setup: ৳৩,০০০ (one-time)**
📌 Domain: Actual cost
📌 Hosting + Technical Support: ৳২,০০০/মাস
📌 Standard package-এর বাইরে Customization: অতিরিক্ত ৳২,০০০

আপনার business-এর জন্য Smart Start আজই করুন। বিস্তারিত জেনে এগিয়ে যান।

### Headline
মাত্র ৳৩,০০০-এ E-commerce Starter Setup

### Description
Modern Website + Checkout + Courier + Pixel & CAPI | Monthly hosting/support extra

### CTA
**Shop Now** or **Learn More** to the payment-enabled verified landing page; prefer Shop Now only when payment gate and pixel Purchase are ready.

## 21-second motion graphic script
0–3s: Incoming price/availability/COD/delivery/order questions → chaotic messages.
3–6s: Silence and clear ৳3,000 reveal.
6–10s: Modern store screen builds in; product/cart/COD message.
10–13.5s: Checkout → Order Confirmed → Courier.
13.5–17s: Website connects to Browser Pixel, Server CAPI, Meta; benefits without guarantees.
17–19.3s: Four checkmarked solution pillars.
19.3–21s: CTA plus pricing disclosure.

### Natural Bangla voiceover (record separately)
“নিজের ই-কমার্স বিজনেস শুরু করতে চান? ওয়েবসাইট, অর্ডার, ডেলিভারি আর বিজ্ঞাপনের ট্র্যাকিং—সব একসাথে সেটআপ করা কঠিন মনে হচ্ছে? AgentSiraji-এর E-commerce Starter-এ মাত্র তিন হাজার টাকায় পাচ্ছেন আধুনিক ওয়েবসাইট, চেকআউট, কুরিয়ার ইন্টিগ্রেশন এবং Meta Pixel ও CAPI সেটআপ। শুধু ওয়েবসাইট নয়, শুরু করুন একটি স্মার্ট সেলিং সিস্টেম নিয়ে। বিস্তারিত দেখুন AgentSiraji ডট কম-এ।”

**Production note:** The generated first creative has original motion/sound cues, but spoken narration is not baked in; use the script for the voiced version. Hosting+support is recurring and extra, and disclosure remains visible in the video ending.
