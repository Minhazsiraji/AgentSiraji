export type PaymentProvider = "sslcommerz" | "bank-transfer" | "paddle" | "manual-invoice";
export type PaymentStatus =
  | "pending_payment"
  | "under_review"
  | "paid"
  | "needs_information"
  | "rejected"
  | "failed"
  | "cancelled"
  | "refunded";

export type SubscriptionStatus = "pending" | "active" | "past_due" | "cancelled" | "expired";

export type CheckoutRoute = {
  provider: PaymentProvider;
  market: "bd" | "international";
  label: string;
  description: string;
  mode: "sandbox" | "manual-test";
  autoActivatesAfterVerifiedPayment: boolean;
};

export const checkoutRoutes: CheckoutRoute[] = [
  {
    provider: "sslcommerz",
    market: "bd",
    label: "Pay online",
    description: "SSLCOMMERZ sandbox checkout. Production activation must follow server-side gateway verification, never the browser redirect alone.",
    mode: "sandbox",
    autoActivatesAfterVerifiedPayment: true,
  },
  {
    provider: "bank-transfer",
    market: "bd",
    label: "Bank transfer",
    description: "Manual Bangladesh bank payment. Customer proof enters review; only an authorized AgentSiraji admin can approve and activate the order.",
    mode: "manual-test",
    autoActivatesAfterVerifiedPayment: false,
  },
  {
    provider: "paddle",
    market: "international",
    label: "International subscription",
    description: "Paddle sandbox route for international recurring checkout during launch preparation.",
    mode: "sandbox",
    autoActivatesAfterVerifiedPayment: true,
  },
  {
    provider: "manual-invoice",
    market: "international",
    label: "Payoneer / bank invoice",
    description: "Manual B2B invoice route for larger international engagements. Activation follows verified receipt by AgentSiraji.",
    mode: "manual-test",
    autoActivatesAfterVerifiedPayment: false,
  },
];

export const manualBankApprovalRule = {
  customerSubmissionStatus: "under_review" as PaymentStatus,
  approvedStatus: "paid" as PaymentStatus,
  activationRequiresAdminApproval: true,
  requiredAuditFields: ["approvedBy", "approvedAt", "verifiedAmount", "paymentReference"] as const,
};
