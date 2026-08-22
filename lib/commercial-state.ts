import type { PaymentProvider, PaymentStatus, SubscriptionStatus } from "@/lib/billing";

export type EntitlementStatus = "inactive" | "active" | "suspended" | "revoked";

export type PaymentDecision = {
  paymentStatus: PaymentStatus;
  subscriptionStatus: SubscriptionStatus;
  entitlementStatus: EntitlementStatus;
  mayBeginOnboarding: boolean;
};

const verifiedAutomaticProviders = new Set<PaymentProvider>(["sslcommerz", "paddle"]);
const manualProviders = new Set<PaymentProvider>(["bank-transfer", "manual-invoice"]);

export function paymentDecision(input: {
  provider: PaymentProvider;
  gatewayVerified?: boolean;
  adminApproved?: boolean;
  paymentStatus: PaymentStatus;
}): PaymentDecision {
  const { provider, gatewayVerified = false, adminApproved = false, paymentStatus } = input;

  if (paymentStatus === "refunded" || paymentStatus === "cancelled" || paymentStatus === "failed" || paymentStatus === "rejected") {
    return {
      paymentStatus,
      subscriptionStatus: "cancelled",
      entitlementStatus: "inactive",
      mayBeginOnboarding: false,
    };
  }

  if (verifiedAutomaticProviders.has(provider) && gatewayVerified && paymentStatus === "paid") {
    return {
      paymentStatus: "paid",
      subscriptionStatus: "active",
      entitlementStatus: "active",
      mayBeginOnboarding: true,
    };
  }

  if (manualProviders.has(provider) && adminApproved && paymentStatus === "paid") {
    return {
      paymentStatus: "paid",
      subscriptionStatus: "active",
      entitlementStatus: "active",
      mayBeginOnboarding: true,
    };
  }

  return {
    paymentStatus,
    subscriptionStatus: "pending",
    entitlementStatus: "inactive",
    mayBeginOnboarding: false,
  };
}

export function assertSafeActivation(input: {
  provider: PaymentProvider;
  gatewayVerified?: boolean;
  adminApproved?: boolean;
  paymentStatus: PaymentStatus;
}) {
  const decision = paymentDecision(input);
  if (decision.entitlementStatus === "active" && decision.paymentStatus !== "paid") {
    throw new Error("Commercial invariant violated: unpaid payment cannot activate entitlement.");
  }
  if (input.provider === "bank-transfer" && decision.entitlementStatus === "active" && !input.adminApproved) {
    throw new Error("Commercial invariant violated: Bangladesh bank transfer requires admin approval.");
  }
  if ((input.provider === "sslcommerz" || input.provider === "paddle") && decision.entitlementStatus === "active" && !input.gatewayVerified) {
    throw new Error("Commercial invariant violated: gateway checkout requires server-side verification.");
  }
  return decision;
}
