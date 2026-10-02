import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SupportAssistant } from "@/components/SupportAssistant";
import { MetaTracking } from "@/components/MetaTracking";
import { GoogleTracking } from "@/components/GoogleTracking";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";
import "./form-controls.css";
import "./ui-polish.css";
import "./ticker-fix.css";
import "./ticker-marquee.css";
import "./support-assistant.css";
import "./meta-consent.css";

const siteUrl = getSiteUrl();
const isProduction = process.env.VERCEL_ENV === "production";
const metaDomainVerification = "ab6l8vyjzvdvmhpa2c4k4i68fkabwz";
const configuredMetaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const metaPixelId = configuredMetaPixelId && /^\d+$/.test(configuredMetaPixelId)
  ? configuredMetaPixelId
  : "1054067190449122";

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
    siteName: "AgentSiraji",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AgentSiraji — Software that moves business forward",
    description: "Managed commerce and practical software built to help businesses sell, convert and grow.",
  },
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  manifest: "/manifest.webmanifest",
  other: { "facebook-domain-verification": metaDomainVerification },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Script id="agentsiraji-meta-pixel-base" strategy="beforeInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
        {children}
        <SupportAssistant />
        <MetaTracking />
        <GoogleTracking />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
