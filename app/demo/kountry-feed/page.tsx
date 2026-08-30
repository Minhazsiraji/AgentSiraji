import type { Metadata } from "next";
import { KountryFeedDemo } from "./kountry-feed-demo";

export const metadata: Metadata = {
  title: "Kountry Feed · Personalized Commerce Concept",
  description: "A private AgentSiraji Commerce concept for Kountry Feed in Rwanda.",
  robots: { index: false, follow: false },
};

export default function KountryFeedDemoPage() {
  return <KountryFeedDemo />;
}
