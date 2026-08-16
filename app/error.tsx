"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error", error.digest || error.message);
  }, [error]);

  return (
    <main className="error-page shell">
      <span className="kicker">Something went wrong</span>
      <h1>The page hit a problem.<br /><em>Let&apos;s try that again.</em></h1>
      <p>No information was lost. Retry the page, or return home if the issue continues.</p>
      <div className="hero-actions">
        <button className="button button-primary" onClick={reset}>Try again →</button>
        <Link className="text-link" href="/">Return home</Link>
      </div>
    </main>
  );
}
