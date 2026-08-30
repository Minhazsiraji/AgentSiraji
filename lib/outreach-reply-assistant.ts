import { commercePlans } from "@/lib/catalog";

export type OutreachReplyIntent =
  | "SENSITIVE_DATA"
  | "DO_NOT_CONTACT"
  | "NOT_INTERESTED"
  | "MAYBE_LATER"
  | "HAS_WEBSITE"
  | "LEAD_MANAGEMENT"
  | "AD_RESEARCH"
  | "BOTH_GROWTH"
  | "PRICE"
  | "DEMO_REQUEST"
  | "MEETING_REQUEST"
  | "INTERESTED"
  | "GREETING"
  | "DISCOVERY";

export type OutreachProductRoute = "COMMERCE" | "LEADPILOT" | "ADINTEL" | "DISCOVERY" | "PARTNER" | "NONE";
export type OutreachNextAction = "QUALIFY" | "DEMO" | "FOLLOW_UP" | "CLOSE" | "MEETING" | "DISCOVERY" | "PARTNER";

export type OutreachReplyAnalysis = {
  intent: OutreachReplyIntent;
  recommendedProduct: OutreachProductRoute;
  nextAction: OutreachNextAction;
  replyStatus: "POSITIVE" | "MAYBE_LATER" | "NOT_INTERESTED" | "DO_NOT_CONTACT";
  suggestedReply: string;
  confidence: number;
  humanReview: boolean;
};

type Input = {
  message: string;
  businessName: string;
  country: string;
  isPartner: boolean;
};

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function firstName(businessName: string) {
  return businessName.trim() || "there";
}

function starterPrice() {
  const starter = commercePlans.find((plan) => plan.id === "starter")!;
  return `${starter.setup.international} setup + ${starter.monthly.international}`;
}

export function analyzeOutreachReply(input: Input): OutreachReplyAnalysis {
  const raw = input.message.trim();
  const message = raw.toLowerCase();
  const name = firstName(input.businessName);

  if (
    hasAny(message, [
      "password",
      "otp",
      "one time password",
      "cvv",
      "card number",
      "api key",
      "secret key",
      "passport",
      "national id",
      "nid",
    ])
  ) {
    return {
      intent: "SENSITIVE_DATA",
      recommendedProduct: "NONE",
      nextAction: "DISCOVERY",
      replyStatus: "POSITIVE",
      confidence: 0.99,
      humanReview: true,
      suggestedReply:
        "Thanks for the reply. For security, please don’t send passwords, OTPs, card details, API keys or identity documents here. We can continue without any sensitive information — tell me only what you’re trying to achieve and I’ll guide you from there.",
    };
  }

  if (hasAny(message, ["stop messaging", "do not contact", "don't contact", "dont contact", "unsubscribe", "remove me", "stop contacting"])) {
    return {
      intent: "DO_NOT_CONTACT",
      recommendedProduct: "NONE",
      nextAction: "CLOSE",
      replyStatus: "DO_NOT_CONTACT",
      confidence: 0.99,
      humanReview: false,
      suggestedReply: "Understood. I won’t contact you again. Wishing you and the business all the best.",
    };
  }

  if (hasAny(message, ["not interested", "no thanks", "no thank", "not for us", "not for me", "we're good", "we are good"])) {
    return {
      intent: "NOT_INTERESTED",
      recommendedProduct: "NONE",
      nextAction: "CLOSE",
      replyStatus: "NOT_INTERESTED",
      confidence: 0.98,
      humanReview: false,
      suggestedReply: "No problem at all — thanks for letting me know. Wishing you continued growth with the business.",
    };
  }

  if (hasAny(message, ["maybe later", "not now", "later", "next month", "another time", "busy now", "currently busy"])) {
    return {
      intent: "MAYBE_LATER",
      recommendedProduct: "NONE",
      nextAction: "FOLLOW_UP",
      replyStatus: "MAYBE_LATER",
      confidence: 0.94,
      humanReview: false,
      suggestedReply: "Absolutely — no pressure. I’ll leave it here for now. If it’s useful, I can check back later rather than crowding your inbox.",
    };
  }

  if (input.isPartner) {
    if (hasAny(message, ["yes", "sure", "interested", "send", "details", "tell me", "how does", "partnership", "commission"])) {
      return {
        intent: "INTERESTED",
        recommendedProduct: "PARTNER",
        nextAction: "PARTNER",
        replyStatus: "POSITIVE",
        confidence: 0.95,
        humanReview: false,
        suggestedReply: `Great, ${name}. The idea is simple: you keep the local client relationship, and AgentSiraji can handle the commerce delivery when a client needs a ready store instead of a long custom build. We can structure it as referral or white-label cooperation. Want me to send the short partner outline?`,
      };
    }
  }

  const hasWebsite = hasAny(message, [
    "already have a website",
    "already have website",
    "we have a website",
    "we have website",
    "have our own website",
    "have an ecommerce site",
    "have an e-commerce site",
    "already have an online store",
    "already have a store",
  ]);
  const leadPain = hasAny(message, ["lead", "leads", "follow up", "follow-up", "customer messages", "inquiries", "enquiries", "whatsapp", "messenger", "crm"]);
  const adPain = hasAny(message, ["competitor", "competitors", "ads", "advertising", "campaign", "creative", "ad research", "meta ads", "facebook ads"]);

  if (hasWebsite && leadPain && adPain) {
    return {
      intent: "BOTH_GROWTH",
      recommendedProduct: "DISCOVERY",
      nextAction: "DISCOVERY",
      replyStatus: "POSITIVE",
      confidence: 0.97,
      humanReview: false,
      suggestedReply:
        "That makes sense — then I wouldn’t push a new store. We cover both sides too: LeadPilot for keeping leads/follow-ups organized, and AdIntel for competitor ad research. Which one is the bigger bottleneck for you right now — leads or ads?",
    };
  }

  if (hasWebsite && leadPain) {
    return {
      intent: "LEAD_MANAGEMENT",
      recommendedProduct: "LEADPILOT",
      nextAction: "QUALIFY",
      replyStatus: "POSITIVE",
      confidence: 0.97,
      humanReview: false,
      suggestedReply:
        "That makes sense — then a new store probably isn’t the priority. The lead/follow-up side is actually what AgentSiraji LeadPilot is being built for: keeping incoming conversations organized so opportunities don’t get lost. If useful, I can show you a short early demo of that instead.",
    };
  }

  if (hasWebsite && adPain) {
    return {
      intent: "AD_RESEARCH",
      recommendedProduct: "ADINTEL",
      nextAction: "QUALIFY",
      replyStatus: "POSITIVE",
      confidence: 0.97,
      humanReview: false,
      suggestedReply:
        "That makes sense — then I wouldn’t suggest replacing your website. We’re also preparing AgentSiraji AdIntel for competitor ad research and creative intelligence. If ads are a bigger priority, I can show you a quick example using your market instead.",
    };
  }

  if (hasWebsite) {
    return {
      intent: "HAS_WEBSITE",
      recommendedProduct: "DISCOVERY",
      nextAction: "DISCOVERY",
      replyStatus: "POSITIVE",
      confidence: 0.98,
      humanReview: false,
      suggestedReply:
        "That’s good to know — then a new store may not be the right starting point. Quick question: what matters more for you right now — keeping incoming leads/follow-ups organized, or finding better ad ideas and seeing what competitors are running?",
    };
  }

  if (leadPain && adPain) {
    return {
      intent: "BOTH_GROWTH",
      recommendedProduct: "DISCOVERY",
      nextAction: "DISCOVERY",
      replyStatus: "POSITIVE",
      confidence: 0.94,
      humanReview: false,
      suggestedReply:
        "We can help on both sides. To keep this useful instead of giving you a big product pitch, which is the bigger issue right now: keeping leads/follow-ups under control, or finding stronger ad ideas from competitor research?",
    };
  }

  if (leadPain) {
    return {
      intent: "LEAD_MANAGEMENT",
      recommendedProduct: "LEADPILOT",
      nextAction: "QUALIFY",
      replyStatus: "POSITIVE",
      confidence: 0.94,
      humanReview: false,
      suggestedReply:
        "Got it. That’s the side AgentSiraji LeadPilot is designed around — keeping leads and follow-ups in one workflow so good enquiries don’t disappear in chat. We’re preparing it for release now. Want me to show you a short early demo?",
    };
  }

  if (adPain) {
    return {
      intent: "AD_RESEARCH",
      recommendedProduct: "ADINTEL",
      nextAction: "QUALIFY",
      replyStatus: "POSITIVE",
      confidence: 0.94,
      humanReview: false,
      suggestedReply:
        "Got it. That’s closer to AgentSiraji AdIntel — it’s focused on competitor ad research and turning what’s happening in a market into better original campaign ideas. We’re preparing it for release now. Want me to show you a quick example?",
    };
  }

  if (hasAny(message, ["price", "pricing", "cost", "how much", "fee", "charges"])) {
    return {
      intent: "PRICE",
      recommendedProduct: "COMMERCE",
      nextAction: "QUALIFY",
      replyStatus: "POSITIVE",
      confidence: 0.96,
      humanReview: false,
      suggestedReply: `Sure. For international clients, AgentSiraji Commerce currently starts at ${starterPrice()}. The right plan depends on the catalog and workflow, so I’d rather show you the short demo first and only recommend a plan if it actually fits. Want the demo link?`,
    };
  }

  if (hasAny(message, ["send demo", "demo link", "show me", "let me see", "can i see", "can we see", "send the link", "send link"])) {
    return {
      intent: "DEMO_REQUEST",
      recommendedProduct: "COMMERCE",
      nextAction: "DEMO",
      replyStatus: "POSITIVE",
      confidence: 0.97,
      humanReview: false,
      suggestedReply:
        "Sure — here’s the live demo: https://sirajibd.com. Try it from mobile like a customer would. If the flow makes sense for your business, I can then show you how we’d adapt the branding and catalog for you.",
    };
  }

  if (hasAny(message, ["call me", "call", "meeting", "zoom", "google meet", "meet", "speak", "talk"])) {
    return {
      intent: "MEETING_REQUEST",
      recommendedProduct: "COMMERCE",
      nextAction: "MEETING",
      replyStatus: "POSITIVE",
      confidence: 0.92,
      humanReview: false,
      suggestedReply:
        "Absolutely. Send me a time that works for you and your timezone, and I’ll confirm the meeting. If you prefer, I can also send the short demo first so the call stays focused.",
    };
  }

  if (hasAny(message, ["yes", "sure", "okay", "ok", "interested", "what idea", "what's the idea", "whats the idea", "tell me more", "send it", "go ahead", "details", "more information"])) {
    return {
      intent: "INTERESTED",
      recommendedProduct: "COMMERCE",
      nextAction: "QUALIFY",
      replyStatus: "POSITIVE",
      confidence: 0.93,
      humanReview: false,
      suggestedReply:
        "Thanks. The idea is to keep Instagram/WhatsApp as part of how you sell, but give buyers one simple branded place to browse what’s available and place an order before the back-and-forth starts. I can show you a 60-second live example if you’d like.",
    };
  }

  if (hasAny(message, ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"])) {
    return {
      intent: "GREETING",
      recommendedProduct: "COMMERCE",
      nextAction: "DISCOVERY",
      replyStatus: "POSITIVE",
      confidence: 0.84,
      humanReview: false,
      suggestedReply:
        "Hi — thanks for getting back to me. I had one simple idea around making the buying flow easier without changing how you already sell. Want me to explain it in two lines?",
    };
  }

  return {
    intent: "DISCOVERY",
    recommendedProduct: "DISCOVERY",
    nextAction: "DISCOVERY",
    replyStatus: "POSITIVE",
    confidence: 0.62,
    humanReview: true,
    suggestedReply:
      "Thanks for the reply. So I point you in the right direction instead of giving you a generic pitch: is your bigger focus right now (1) making online ordering easier, (2) managing leads/follow-ups, or (3) finding stronger ad ideas through competitor research?",
  };
}
