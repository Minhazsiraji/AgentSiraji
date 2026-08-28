import { listCommercialProductsAndOffers } from "@/lib/commercial-offers";

export type PublicCommercialOffer = {
  planCode: string;
  planName: string;
  market: string;
  currency: string;
  regularPrice: number | null;
  offerPrice: number | null;
  annualPrice: number | null;
  billingUnit: string;
  offerUnitLabel: string | null;
  offerEnabled: boolean;
  offerStartsAt: string | null;
  offerEndsAt: string | null;
  salesEnabled: boolean;
  usageLimits: Record<string, unknown>;
};

export type PublicCommercialProduct = {
  code: string;
  name: string;
  status: string;
  offers: PublicCommercialOffer[];
};

export async function getPublicCommercialProducts(): Promise<PublicCommercialProduct[]> {
  try {
    return (await listCommercialProductsAndOffers()) as PublicCommercialProduct[];
  } catch (error) {
    console.error("Public commercial configuration unavailable", error);
    return [];
  }
}

export function activeDisplayPrice(offer: PublicCommercialOffer, now = new Date()) {
  if (!offer.offerEnabled || offer.offerPrice == null) return offer.regularPrice;
  const starts = offer.offerStartsAt ? new Date(offer.offerStartsAt) : null;
  const ends = offer.offerEndsAt ? new Date(offer.offerEndsAt) : null;
  if (starts && now < starts) return offer.regularPrice;
  if (ends && now >= ends) return offer.regularPrice;
  return offer.offerPrice;
}

export function formatCommercialPrice(currency: string, amount: number | null) {
  if (amount == null) return "Price not set";
  if (currency === "BDT") {
    return `৳${new Intl.NumberFormat("en-BD", {
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount)}`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
