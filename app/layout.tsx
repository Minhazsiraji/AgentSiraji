import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentsiraji.com"),
  title: { default: "AgentSiraji — Digital products that move business forward", template: "%s | AgentSiraji" },
  description: "Smart digital products and rapid execution for ambitious businesses. Discover LeadPilot, Doctor's Diary, and custom digital services.",
  keywords: ["AgentSiraji", "LeadPilot", "Doctor's Diary", "digital products", "automation", "Bangladesh"],
  openGraph: {
    title: "AgentSiraji — Ideas into impact, fast.",
    description: "Purpose-built digital products and services for modern businesses.",
    url: "https://agentsiraji.com",
    siteName: "AgentSiraji",
    type: "website"
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
