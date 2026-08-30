import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForeignOutreachConsole } from "@/components/ForeignOutreachConsole";
import { OutreachReplyFirstDmPolicy } from "@/components/OutreachReplyFirstDmPolicy";
import { OutreachReplyAssistantPolicy } from "@/components/OutreachReplyAssistantPolicy";
import styles from "./outreach.module.css";

export const metadata: Metadata = {
  title: "Foreign Outreach | AgentSiraji Sales",
  description: "Private AgentSiraji foreign-client outreach workspace.",
  robots: { index: false, follow: false },
};

export default function ForeignOutreachPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return (
    <main className={`${styles.workspace} shell`} style={{ paddingTop: "1.25rem", paddingBottom: "3rem" }}>
      <header
        className="product-card"
        style={{
          padding: "1.1rem 1.35rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span className="kicker">AgentSiraji · Sales Operations</span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.35rem)", margin: ".25rem 0 0" }}>
            Foreign Outreach
          </h1>
        </div>
        <div style={{ maxWidth: "38rem" }}>
          <p style={{ margin: 0 }}>
            Daily prospecting, personalized DMs, follow-ups, reply intelligence, partner leads and country performance — with every external send kept under human approval.
          </p>
        </div>
      </header>

      <ForeignOutreachConsole />
      <OutreachReplyFirstDmPolicy />
      <OutreachReplyAssistantPolicy />
    </main>
  );
}
