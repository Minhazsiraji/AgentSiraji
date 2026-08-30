"use client";

import { useEffect } from "react";

const tokenKey = "agentsiraji-outreach-admin-token";
const salesyPattern = /(AgentSiraji Commerce|branded store|proper online store|high-performance ecommerce|structured orders|excellent fit|checkout|order tracking|own domain|I help businesses like yours|I noticed you are selling)/i;

function isGoodFirstDm(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words >= 25 && words <= 65 && !salesyPattern.test(text);
}

function contactChannel(sellingMethod: string) {
  const value = sellingMethod.toLowerCase();
  const hasWhatsApp = value.includes("whatsapp");
  const hasDm = value.includes("dm") || value.includes("instagram") || value.includes("facebook") || value.includes("messenger");
  if (hasWhatsApp && hasDm) return "DM/WhatsApp";
  if (hasWhatsApp) return "WhatsApp";
  if (hasDm) return "DM";
  if (value.includes("call")) return "phone";
  return "messages";
}

function variantSeed(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2;
}

function buildReplyFirstDm(article: HTMLElement) {
  const businessName = article.querySelector("h3")?.textContent?.trim() || "there";
  const partner = Array.from(article.querySelectorAll(".product-label")).some(
    (node) => node.textContent?.trim().toLowerCase() === "partner",
  );

  const meta = article.querySelector("h3")?.nextElementSibling?.textContent?.trim() || "";
  const parts = meta.split("·").map((part) => part.trim()).filter(Boolean);
  const category = parts[1] || "local retail";
  const sellingMethod = parts.slice(2).join(" · ");

  const locationLabel = Array.from(article.querySelectorAll(".product-label"))
    .map((node) => node.textContent?.trim() || "")
    .find((text) => text.includes("·") && text.toLowerCase() !== "partner") || "";
  const locationParts = locationLabel.split("·").map((part) => part.trim()).filter(Boolean);
  const location = locationParts[1] || locationParts[0] || "";

  if (partner) {
    return `Hi ${businessName} — came across your work${location ? ` in ${location}` : ""}. I’m exploring a simple partnership idea for helping smaller local sellers get online without a long custom build. Thought it might complement what you already do. Want me to send the idea?`;
  }

  const channel = contactChannel(sellingMethod);
  const categoryPhrase = category.toLowerCase();

  if (variantSeed(businessName) === 0) {
    return `Hi ${businessName} — came across your page while looking at ${categoryPhrase} businesses${location ? ` in ${location}` : ""}. Looks like customers can order through ${channel}. I had one simple idea that could make that buying flow easier without changing how you sell now. Want me to send it?`;
  }

  return `Hi ${businessName} — I was checking out ${categoryPhrase} businesses${location ? ` in ${location}` : ""} and found your page. I saw you take orders through ${channel}. There’s one small change I think could make buying easier while keeping the way you already sell. Want me to show you?`;
}

function rewriteCard(article: HTMLElement) {
  const cardText = article.textContent || "";
  if (!cardText.includes("First sent: —")) return;

  const details = Array.from(article.querySelectorAll("details")).find((node) =>
    node.querySelector("summary")?.textContent?.includes("Prepared DM"),
  );
  const paragraph = details?.querySelector("p");
  if (!paragraph) return;

  const current = paragraph.textContent?.trim() || "";
  if (isGoodFirstDm(current)) {
    paragraph.dataset.replyFirstDm = current;
    return;
  }

  const replacement = buildReplyFirstDm(article);
  paragraph.textContent = replacement;
  paragraph.dataset.replyFirstDm = replacement;

  const summary = details?.querySelector("summary strong");
  if (summary) summary.textContent = "Prepared DM · reply-first";
}

function scan() {
  document.querySelectorAll<HTMLElement>("article.product-card").forEach(rewriteCard);
}

export function OutreachReplyFirstDmPolicy() {
  useEffect(() => {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
        if (url.includes("/api/admin/outreach") && !url.includes("/api/admin/outreach/message")) {
          const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
          const token = headers.get("x-agentsiraji-admin-token");
          if (token) sessionStorage.setItem(tokenKey, token);
        }
      } catch {
        // Token capture is best-effort; the protected API still performs authentication.
      }
      return nativeFetch(input, init);
    };

    scan();

    const observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || button.textContent?.trim() !== "Copy DM") return;

      const article = button.closest<HTMLElement>("article.product-card");
      if (!article || !(article.textContent || "").includes("First sent: —")) return;

      rewriteCard(article);
      const dm = article.querySelector<HTMLElement>("details p")?.dataset.replyFirstDm;
      if (!dm) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const original = button.textContent;
      button.textContent = "Saving DM…";

      try {
        const officialContact = article.querySelector<HTMLAnchorElement>('a[href]')?.href || "";
        const token = sessionStorage.getItem(tokenKey) || "";

        if (officialContact && token) {
          const response = await nativeFetch("/api/admin/outreach/message", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-agentsiraji-admin-token": token,
            },
            body: JSON.stringify({ profileUrl: officialContact, dm }),
          });
          if (!response.ok) throw new Error("DM could not be saved");
        }

        await navigator.clipboard.writeText(dm);
        button.textContent = "Reply-first DM copied ✓";
        window.setTimeout(() => { button.textContent = original; }, 1400);
      } catch {
        button.textContent = "Open DM and copy manually";
        const details = article.querySelector("details");
        if (details) details.open = true;
        window.setTimeout(() => { button.textContent = original; }, 1800);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      window.fetch = nativeFetch;
    };
  }, []);

  return null;
}
