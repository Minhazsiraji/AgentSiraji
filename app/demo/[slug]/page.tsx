import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommerceDemoPreview } from "@/components/CommerceDemoPreview";
import { getOutreachDemoBySlug } from "@/lib/outreach-demo-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private commerce concept",
  description: "Private personalized AgentSiraji Commerce concept preview.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PersonalizedDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{8,80}$/.test(slug)) notFound();
  const demo = await getOutreachDemoBySlug(slug);
  if (!demo) notFound();
  return <CommerceDemoPreview demo={demo} />;
}
