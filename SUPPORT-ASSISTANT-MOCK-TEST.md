# AgentSiraji Support Assistant — Mock Test Plan

## Purpose

Validate the customer experience and escalation rules before connecting a live AI provider, production conversation storage, or a real moderator queue.

## Current mock boundaries

- No live AI API key or paid model is connected.
- No production support inbox or moderator account is connected.
- No conversation is persisted by the mock API.
- No live-payment setting is changed.
- The assistant answers only from the current AgentSiraji catalog and published policy/security scope encoded in the mock knowledge layer.
- Low-confidence or sensitive cases escalate instead of forcing an answer.

## Acceptance scenarios

1. `Hello` → greeting; no handoff.
2. `What is the Commerce Starter price in Bangladesh?` → published Starter pricing; no handoff.
3. `How can I pay internationally?` → Paddle/manual B2B route explanation and launch-gate notice; no handoff.
4. `Can I get a refund?` → policy summary plus `/refunds` link; no automatic disputed-case decision.
5. `How do you protect my data?` → security/privacy guidance with public policy link.
6. `Tell me about LeadPilot` → current coming-soon product description.
7. `Is Doctor's Diary for sale?` → Labs/private-development status; not public sale.
8. `I want a human moderator` → simulated handoff with mock ticket reference.
9. Unknown/unverified product-specific question → low-confidence handoff; no hallucinated answer.
10. Message containing `OTP`, `CVV`, `password`, `API key`, or identity-document language → security warning plus handoff.
11. Empty, malformed, oversized, non-JSON, or cross-origin API request → rejected cleanly.
12. Mobile viewport → launcher and panel remain usable without covering the whole page unexpectedly.
13. Keyboard/focus use → launcher, close, suggestions, links, input and send remain operable.
14. Reduced-motion preference → support typing animation is disabled.

## Final production replacement points

Before real customer support launch:

- Replace mock responder with approved AI provider abstraction.
- Add retrieval from versioned AgentSiraji support knowledge, not unrestricted model memory.
- Add authenticated moderator accounts and role-based access.
- Add persistent conversation/ticket storage with retention controls.
- Add queue ownership, assignment, SLA timestamps and audit events.
- Add customer identity/contact capture only when needed for a handoff.
- Add abuse/rate limiting suitable for serverless production.
- Add observability, model-error/fallback metrics and escalation-rate reporting.
- Add moderator reply delivery and customer notification channel.
- Complete privacy/DPA/vendor review for the selected AI provider.
- Run adversarial prompt-injection, data-leakage and policy-boundary tests before enabling live AI.
