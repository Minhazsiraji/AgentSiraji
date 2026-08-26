import { commercePlans, products } from "@/lib/catalog";

export type SupportIntent =
  | "greeting"
  | "commerce"
  | "pricing"
  | "payments"
  | "refunds"
  | "privacy"
  | "security"
  | "leadpilot"
  | "adintel"
  | "doctors-diary"
  | "human"
  | "sensitive-data"
  | "unknown";

export type SupportReply = {
  answer: string;
  confidence: number;
  handoff: boolean;
  intent: SupportIntent;
  links?: Array<{ label: string; href: string }>;
};

const commerce = products.find((product) => product.slug === "commerce")!;
const leadPilot = products.find((product) => product.slug === "leadpilot")!;
const adIntel = products.find((product) => product.slug === "adintel")!;
const doctorsDiary = products.find((product) => product.slug === "doctors-diary")!;

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function pricingSummary() {
  return commercePlans
    .map(
      (plan) =>
        `${plan.name}: Bangladesh ${plan.setup.bd} setup + ${plan.monthly.bd}; International ${plan.setup.international} setup + ${plan.monthly.international}.`,
    )
    .join(" ");
}

export function createMockSupportReply(message: string): SupportReply {
  const input = message.trim().toLowerCase();

  if (
    includesAny(input, [
      "password",
      "otp",
      "one time password",
      "cvv",
      "card number",
      "credit card",
      "debit card",
      "passport",
      "national id",
      "nid number",
      "secret key",
      "api key",
    ])
  ) {
    return {
      intent: "sensitive-data",
      confidence: 0.99,
      handoff: true,
      answer:
        "For your security, please do not send passwords, OTPs, full card numbers, CVVs, API keys, identity documents, or other secrets in chat. I can still help with the issue without those details, or I can hand this conversation to a moderator.",
      links: [{ label: "Security practices", href: "/security" }],
    };
  }

  if (includesAny(input, ["human", "moderator", "agent", "person", "someone", "talk to support"])) {
    return {
      intent: "human",
      confidence: 0.99,
      handoff: true,
      answer:
        "Absolutely. I have marked this conversation for moderator help. In this mock version the handoff is simulated; the final service will place the conversation into the live support queue with its context attached.",
    };
  }

  if (includesAny(input, ["hello", "hi", "hey", "good morning", "good evening", "assalam", "salam"])) {
    return {
      intent: "greeting",
      confidence: 0.98,
      handoff: false,
      answer:
        "Hi — I’m the AgentSiraji Support Assistant mock. I can help with Commerce, plans and pricing, payment routes, refunds and cancellation, privacy, security, LeadPilot, AdIntel, or Doctor’s Diary. If I’m not confident, I’ll offer a moderator handoff instead of guessing.",
    };
  }

  if (includesAny(input, ["price", "pricing", "cost", "plan", "starter", "growth", "pro"])) {
    return {
      intent: "pricing",
      confidence: 0.97,
      handoff: false,
      answer: `${pricingSummary()} These are the current published Commerce plans; final scope is confirmed before implementation.`,
      links: [{ label: "Compare plans", href: "/pricing" }],
    };
  }

  if (includesAny(input, ["payment", "sslcommerz", "paddle", "bank transfer", "payoneer", "invoice"])) {
    return {
      intent: "payments",
      confidence: 0.96,
      handoff: false,
      answer:
        "AgentSiraji Commerce supports Bangladesh and international payment routes in the commercial design. The current public launch is still in preparation, so live payment activation is intentionally gated. Bangladesh routes include SSLCOMMERZ and reviewed bank transfer; international routes include Paddle and a manual B2B invoice route where appropriate.",
      links: [
        { label: "Commerce pricing", href: "/pricing" },
        { label: "Refund policy", href: "/refunds" },
      ],
    };
  }

  if (includesAny(input, ["refund", "cancel", "cancellation", "money back", "chargeback"])) {
    return {
      intent: "refunds",
      confidence: 0.97,
      handoff: false,
      answer:
        "Refund and cancellation eligibility depends on the service stage, work already performed, recurring-service timing, third-party costs, and any mandatory consumer rights that apply. I can explain the published rules, but a disputed or exceptional case should be reviewed by a moderator rather than decided automatically.",
      links: [{ label: "Refund & cancellation policy", href: "/refunds" }],
    };
  }

  if (includesAny(input, ["privacy", "data", "gdpr", "personal information", "delete my data", "cookies"])) {
    return {
      intent: "privacy",
      confidence: 0.96,
      handoff: false,
      answer:
        "AgentSiraji’s published privacy baseline explains what data may be collected, why it is used, retention, processors, international transfers, and access/correction/deletion/objection-style rights where applicable. Please use the Privacy page for the authoritative public wording.",
      links: [{ label: "Privacy policy", href: "/privacy" }],
    };
  }

  if (includesAny(input, ["security", "safe", "breach", "hack", "vulnerability", "encrypted", "encryption"])) {
    return {
      intent: "security",
      confidence: 0.96,
      handoff: false,
      answer:
        "AgentSiraji documents a security baseline covering HTTPS/TLS, browser security headers, input validation, secret handling, payment verification, replay protection, least privilege, monitoring, incident response, and responsible vulnerability reporting. We do not claim certifications that have not been independently obtained.",
      links: [{ label: "Security practices", href: "/security" }],
    };
  }

  if (includesAny(input, ["commerce", "store", "ecommerce", "e-commerce", "online shop", "website shop"])) {
    return {
      intent: "commerce",
      confidence: 0.96,
      handoff: false,
      answer: `${commerce.name} is ${commerce.summary.toLowerCase()} It is currently the first AgentSiraji product available for commercial purchase.`,
      links: [
        { label: "Explore Commerce", href: "/products/commerce" },
        { label: "Pricing", href: "/pricing" },
      ],
    };
  }

  if (includesAny(input, ["leadpilot", "lead pilot", "lead", "messenger", "whatsapp", "conversion"])) {
    return {
      intent: "leadpilot",
      confidence: 0.92,
      handoff: false,
      answer: `${leadPilot.name} is ${leadPilot.summary.toLowerCase()} Its current public status is coming soon.`,
      links: [{ label: "LeadPilot", href: "/products/leadpilot" }],
    };
  }

  if (includesAny(input, ["adintel", "ad intel", "advertising", "ad research", "ads", "campaign"])) {
    return {
      intent: "adintel",
      confidence: 0.92,
      handoff: false,
      answer: `${adIntel.name} is ${adIntel.summary.toLowerCase()} Its current public status is coming soon.`,
      links: [{ label: "AdIntel", href: "/products/adintel" }],
    };
  }

  if (includesAny(input, ["doctor", "doctor's diary", "doctors diary", "clinical", "healthcare"])) {
    return {
      intent: "doctors-diary",
      confidence: 0.94,
      handoff: false,
      answer: `${doctorsDiary.name} is ${doctorsDiary.summary.toLowerCase()} It is an AgentSiraji Labs project and is not currently offered for public sale.`,
      links: [{ label: "AgentSiraji Labs", href: "/products/doctors-diary" }],
    };
  }

  return {
    intent: "unknown",
    confidence: 0.35,
    handoff: true,
    answer:
      "I don’t have enough verified information to answer that confidently, so I won’t guess. I can hand this to a moderator with the conversation context attached. In this mock version, that handoff is simulated for testing.",
  };
}
