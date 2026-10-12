import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { FAQ_GROUPS } from "./faqs";

const Plus = () => (
  <span className="faq-plus flex-none w-[34px] h-[34px] rounded-full grid place-items-center transition-transform bg-[var(--pg-bg)]" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10231F" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
  </span>
);

const anchor = (s) => s.toLowerCase().replace(/[^a-z]+/g, "-");

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageHero eyebrow="Help Center" title="Questions we hear" accent="every June." intro="Answers for students, parents and PG owners. Can't find yours? Our team replies within a working day.">
          <div className="flex flex-wrap gap-2 pt-1">
            {FAQ_GROUPS.map((g) => (
              <a key={g.group} href={`#${anchor(g.group)}`} className="no-underline text-[var(--pg-ink)] bg-white border border-[rgba(16,35,31,.12)] rounded-full px-4 min-h-10 inline-flex items-center text-sm font-semibold hover:border-[var(--pg-ink)] transition-colors">
                {g.group}
              </a>
            ))}
          </div>
        </PageHero>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-28 flex flex-col gap-16">
          {FAQ_GROUPS.map((g) => (
            <section key={g.group} id={anchor(g.group)} className="scroll-mt-24 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
              <div className="flex flex-col gap-3 lg:sticky lg:top-24">
                <span className="eyebrow">{g.items.length} answers</span>
                <h2 className="display m-0 font-extrabold" style={{ fontSize: "clamp(30px, 3vw, 44px)", lineHeight: 1, letterSpacing: "-0.04em" }}>{g.group}</h2>
              </div>
              <div className="flex flex-col gap-2.5">
                {g.items.map((q) => (
                  <details key={q.q} className="bg-white rounded-[22px] px-6">
                    <summary className="flex justify-between items-center gap-4 py-[22px] text-lg font-bold min-h-11">
                      {q.q}
                      <Plus />
                    </summary>
                    <p className="m-0 pb-[22px] text-base leading-relaxed text-[var(--pg-text-secondary)] max-w-[680px]">{q.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="rounded-[30px] px-7 py-8 flex flex-wrap items-center justify-between gap-5" style={{ background: "var(--pg-forest)", color: "#F5F3EE" }}>
            <div className="flex flex-col gap-1 max-w-[520px]">
              <span className="display text-2xl font-bold">Still stuck?</span>
              <span className="text-[15px]" style={{ color: "rgba(245,243,238,.75)" }}>Tell us what you&apos;re looking for and we&apos;ll get back to you.</span>
            </div>
            <Link href="/contact" className="inline-flex items-center min-h-12 px-6 rounded-full font-bold text-[15px] no-underline" style={{ background: "var(--pg-lamp)", color: "#2A1C00" }}>Contact us</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
