export type Market = "bd" | "international";
export type ProductStatus = "available" | "coming-soon" | "labs";

export type CommercePlan = {
  id: "starter" | "growth" | "pro";
  name: string;
  bestFor: string;
  setup: Record<Market, string>;
  monthly: Record<Market, string>;
  highlight?: boolean;
};

export const products = [
  {
    slug: "commerce",
    name: "AgentSiraji Commerce",
    shortName: "Commerce",
    pillar: "Sell",
    category: "Managed commerce",
    status: "available" as ProductStatus,
    summary:
      "A high-performance managed e-commerce platform for brands that want to sell professionally without rebuilding the technology stack from scratch.",
  },
  {
    slug: "leadpilot",
    name: "AgentSiraji LeadPilot",
    shortName: "LeadPilot",
    pillar: "Convert",
    category: "Lead & order conversion",
    status: "coming-soon" as ProductStatus,
    summary:
      "Bring customer conversations and leads into a focused workflow so teams can reply faster, qualify intent, and move more orders forward.",
  },
  {
    slug: "adintel",
    name: "AgentSiraji AdIntel",
    shortName: "AdIntel",
    pillar: "Grow",
    category: "Advertising intelligence",
    status: "coming-soon" as ProductStatus,
    summary:
      "Research advertising patterns, understand what is working in a market, and turn those insights into stronger original campaign ideas.",
  },
  {
    slug: "doctors-diary",
    name: "Doctor's Diary",
    shortName: "Doctor's Diary",
    pillar: "Labs",
    category: "Healthcare technology",
    status: "labs" as ProductStatus,
    summary:
      "A doctor-first clinical workspace under private development and pilot preparation. Not currently offered for public sale.",
  },
] as const;

export const commercePlans: CommercePlan[] = [
  {
    id: "starter",
    name: "Starter",
    bestFor: "New and focused online stores",
    setup: { bd: "৳29,900", international: "$399" },
    monthly: { bd: "৳1,990/mo", international: "$29/mo" },
  },
  {
    id: "growth",
    name: "Growth",
    bestFor: "Growing brands that need more room",
    setup: { bd: "৳49,900", international: "$699" },
    monthly: { bd: "৳3,490/mo", international: "$49/mo" },
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    bestFor: "Established brands and advanced needs",
    setup: { bd: "৳79,900", international: "$1,199" },
    monthly: { bd: "৳5,990/mo", international: "$89/mo" },
  },
];

export const bdPaymentMethods = [
  "SSLCOMMERZ — online payment with server-side verification",
  "Bank transfer — manual review and admin approval before activation",
] as const;

export const internationalPaymentMethods = [
  "Paddle — subscription checkout (sandbox during launch preparation)",
  "Payoneer / bank invoice — manual B2B route for larger engagements",
] as const;
