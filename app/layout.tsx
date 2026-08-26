import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";
import "./form-controls.css";
import "./ui-polish.css";

const siteUrl = getSiteUrl();
const isProduction = process.env.VERCEL_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AgentSiraji — Software that helps businesses sell, convert and grow",
    template: "%s | AgentSiraji",
  },
  description: "AgentSiraji builds practical software for ambitious businesses, led by managed e-commerce through AgentSiraji Commerce, with LeadPilot and AdIntel expanding the sell-convert-grow product system.",
  keywords: [
    "AgentSiraji",
    "AgentSiraji Commerce",
    "managed ecommerce",
    "e-commerce platform",
    "LeadPilot",
    "AdIntel",
    "business software",
    "Bangladesh",
  ],
  openGraph: {
    title: "AgentSiraji — Software that moves business forward",
    description: "Managed commerce and practical software built to help businesses sell, convert and grow.",
    url: siteUrl,
    siteName: "AgentSiraji",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentSiraji — Software that moves business forward",
    description: "Managed commerce and practical software built to help businesses sell, convert and grow.",
  },
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
