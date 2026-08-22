import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Doctor's Diary — AgentSiraji Labs",
  description: "A doctor-first clinical workspace under private development and pilot preparation.",
};

export default function DoctorsDiaryPage() {
  return (
    <main>
      <SiteHeader />
      <section className="product-hero diary-product shell">
        <div>
          <span className="status">Private development</span>
          <span className="kicker">AgentSiraji Labs · Healthcare technology</span>
          <h1>Doctor-first clinical work.<br /><em>Built with care.</em></h1>
          <p>Doctor&apos;s Diary is a clinical workspace being prepared for controlled pilot use. The current focus is the doctor workflow, patient continuity, prescription safety, privacy, and reliable day-to-day clinical operations.</p>
        </div>
        <div className="product-monogram">DD<span>Doctor&apos;s Diary</span></div>
      </section>

      <section className="feature-band shell">
        <article><b>01</b><h3>Consult</h3><p>Support a clear doctor-led consultation workflow from patient review through clinical documentation.</p></article>
        <article><b>02</b><h3>Prescribe</h3><p>Prepare, review, finalize, and print structured prescriptions with explicit doctor approval.</p></article>
        <article><b>03</b><h3>Continue</h3><p>Return to the same patient with the relevant history, documents, and follow-up context intact.</p></article>
      </section>

      <section className="product-story shell">
        <span className="kicker">Not for public sale</span>
        <h2>Private pilot first.<br /><em>Commercialization later.</em></h2>
        <p>Doctor&apos;s Diary is intentionally separated from the current AgentSiraji sales funnel. It will remain in Labs/private development until clinical reliability, privacy, pilot feedback, and the product&apos;s commercial readiness meet the release standard.</p>
      </section>
      <SiteFooter />
    </main>
  );
}
