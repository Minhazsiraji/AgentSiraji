"use client";

import Script from "next/script";
import { useState } from "react";

const PIXEL_ID = "1054067190449122";

export default function MetaSetupPage() {
  const [ready, setReady] = useState(false);

  return (
    <main style={{ maxWidth: 760, margin: "64px auto", padding: "0 24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Meta Pixel setup diagnostic</h1>
      <p>This temporary noindex page exists only to let Meta's Event Setup Tool detect the AgentSiraji Pixel.</p>
      <p><strong>Pixel ID:</strong> {PIXEL_ID}</p>
      <p><strong>Status:</strong> {ready ? "Pixel loaded and PageView sent" : "Loading Pixel…"}</p>
      <p>No Lead, Contact, Purchase, or checkout events are generated here.</p>

      <Script id="agentsiraji-meta-setup-pixel" strategy="afterInteractive" onReady={() => setReady(true)}>
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
      </Script>
    </main>
  );
}
