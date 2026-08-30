"use client";

import { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OutreachDemoStudio } from "@/components/OutreachDemoStudio";

const tokenKey = "agentsiraji-outreach-admin-token";

type DemoLead = {
  id: string;
  businessName: string;
  country: string;
  city: string | null;
  category: string | null;
  profileUrl: string | null;
  replyStatus: string;
  status: string;
};

type ApiResponse = { ok?: boolean; error?: string; lead?: DemoLead };

function DemoStudioMount({ profileUrl }: { profileUrl: string }) {
  const [lead, setLead] = useState<DemoLead | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const sessionToken = sessionStorage.getItem(tokenKey) || "";
    if (!sessionToken) return;
    setToken(sessionToken);
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/admin/outreach/demo?profileUrl=${encodeURIComponent(profileUrl)}`, {
          headers: { "x-agentsiraji-admin-token": sessionToken },
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiResponse;
        if (!cancelled && response.ok && payload.lead) setLead(payload.lead);
      } catch {
        // Keep the lead card usable if Demo Studio cannot initialize.
      }
    })();

    return () => { cancelled = true; };
  }, [profileUrl]);

  if (!lead || !token) return null;
  return <OutreachDemoStudio lead={lead} token={token} />;
}

export function OutreachDemoStudioPolicy() {
  useEffect(() => {
    const roots = new Map<HTMLElement, Root>();

    function scan() {
      for (const [host, root] of roots) {
        if (!host.isConnected) {
          root.unmount();
          roots.delete(host);
        }
      }

      document.querySelectorAll<HTMLElement>("article.product-card").forEach((article) => {
        const cardText = article.textContent || "";
        const positive = cardText.includes("Reply: POSITIVE") || /·\s*(REPLIED|DEMO|PROPOSAL)\b/.test(cardText);
        if (!positive || cardText.includes("Partner")) return;
        if (article.querySelector("[data-outreach-demo-studio]")) return;

        const officialLink = Array.from(article.querySelectorAll<HTMLAnchorElement>("a[href]")).find((anchor) =>
          anchor.textContent?.includes("Open official contact"),
        );
        if (!officialLink?.href) return;

        const actionButtons = Array.from(article.querySelectorAll<HTMLElement>("div")).find((node) =>
          Array.from(node.children).some((child) => child instanceof HTMLButtonElement && child.textContent?.trim() === "Demo"),
        );
        const host = document.createElement("span");
        host.dataset.outreachDemoStudio = "true";
        if (actionButtons) actionButtons.appendChild(host);
        else article.appendChild(host);

        const root = createRoot(host);
        roots.set(host, root);
        root.render(<DemoStudioMount profileUrl={officialLink.href} />);
      });
    }

    scan();
    const observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      for (const root of roots.values()) root.unmount();
      roots.clear();
    };
  }, []);

  return null;
}
