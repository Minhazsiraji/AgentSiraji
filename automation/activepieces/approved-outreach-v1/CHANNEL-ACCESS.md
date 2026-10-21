# AS-05 — Platform access and submission decision matrix

**Reviewed 21 Oct 2026. This document grants no sending authorization.**

| Channel | Appropriate operation | Available technical route | Status in AgentSiraji | Safety / costs |
| --- | --- | --- | --- | --- |
| Freelancer.com job listing | One tailored, owner-approved **bid/proposal through the project listing** (rather than cold DM) | Official Freelancer API and official site contain bidding workflows; official Python SDK lists `Create a Bid` and messaging endpoints. | **No account/API connection verified**, no bid submitted. | Confirm authenticated freelance account eligibility, bid allowances, platform fees/credits, project terms, bid amount, timeline and full message before each bid. Use official https://developer.freelancer.com/ and https://github.com/freelancer/freelancer-sdk-python ; never invent prior Shopify delivery. |
| Freelancer.nl job listing | Proposal through its designated application/workspace | Browser if authenticated/authorized and supported | **No signed-in session connected** | Check applicant rules and whether account can actually submit, no off-platform circumvention. |
| LinkedIn person requesting developer | Personalized response to a specific current public request using platform messaging | Signed-in human or Work browser if authorized and supported; general app APIs are not permission to send individual member DMs. | **No authorized message transport connected** | Verify request still open, recipient identity and account access; no automated unsolicited message blasts, no scraping/proxy tools. LinkedIn API policies https://www.linkedin.com/legal/l/api-terms-of-use . |
| Facebook Page / Instagram business | Relevant, individual, permission-respecting inquiry | Signed-in browser UI when permitted; business APIs typically serve messages to one's own page inbox and require permissions | **No connected outbound DM capability** | BD social sellers did not explicitly request developers; qualify separately rather than assume consent. |
| WhatsApp business | Message only with an appropriate customer opt-in and supported approved template/session | Meta official WhatsApp Business Platform Cloud API or manually in authorized app | **No registered WABA/API connection or opt-in demonstrated** | Meta's API requires business portfolio, WABA and phone number; business-initiated API messages require compliant approved templates/consent and may incur charges. Not a free or permissionless way to send cold DMs. Sources: https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api , https://about.fb.com/news/2025/04/ways-to-manage-your-businesses-chats-on-whatsapp/ . |
| Email address explicitly published for RFP | Send a single requested proposal if public instructions permit email | Connected email app, only with explicit per-message owner approval | **No email sending connector authorized in AS-05** | Do not bypass tender/bidding channel rules or platform fees. |

## Priority for first paying clients

1. Explicit current platform invitation, practical small project scope and verified account -> **proposal through same platform**.
2. Verified, current person requesting development and explicitly inviting direct contact -> **one tailored reply/DM** after user approves exact recipient+message.
3. General businesses that sell on social channels but have NOT requested web services -> **research only** unless an allowed contact path and genuine business-development basis are independently established. Avoid unsolicited repetitive messages.

## Approval release evidence

Before sending **each** message or bid, store:
- stable lead ID, original source link and verification date;
- exact account/recipient/channel and current open post;
- final approved full text plus any bid amount, delivery period and milestone terms;
- user approval record retrieved from a trusted owner action (never simply `approved_by: OWNER` in AI-generated JSON);
- durable duplicate-submission check and reserved attempt;
- recorded platform receipt or human-confirmed observation;
- actual reply evidence before marking REPLIED.

## Authentication boundary

This ChatGPT chat can connect to the user's online laptop via Remote Desktop Commander terminal, but **that is not access to their authenticated web browser**. Connected Browser requires the originating browser extension context, and Activepieces Flow management API endpoints require an authenticated platform API key. Do not locate, read or export local browser cookies, local storage or app session tokens to get around that boundary. Use ChatGPT Work Cloud Browser signed in by the user, or an explicitly connected official plugin/API account.

The cloud flows AS-01 and AS-02 remain as they are. This AS-05 channel assessment does not start automation, spend credits or authorize any customer contact.
