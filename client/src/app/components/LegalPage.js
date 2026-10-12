import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHero from "./PageHero";

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function LegalPage({ title, updated, sections }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageHero eyebrow="Legal" title={title} intro={`Last updated ${updated}.`} size="clamp(40px, 4.8vw, 68px)" />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-28 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
          <nav aria-label="On this page" className="hidden lg:flex flex-col gap-1 sticky top-24">
            <span className="mono text-[11px] tracking-[.14em] text-[var(--pg-text-tertiary)] mb-2">ON THIS PAGE</span>
            {sections.map((s) => (
              <a key={s.heading} href={`#${slug(s.heading)}`} className="text-sm text-[var(--pg-text-secondary)] no-underline py-1.5 hover:text-[var(--pg-terracotta)] transition-colors">
                {s.heading}
              </a>
            ))}
            <div className="kasavu w-24 mt-4 opacity-70" aria-hidden="true" />
          </nav>
          <div className="bg-white rounded-[30px] p-7 sm:p-10 flex flex-col gap-10" style={{ boxShadow: "var(--pg-shadow-card)" }}>
            {sections.map((s) => (
              <section key={s.heading} id={slug(s.heading)} className="scroll-mt-24 flex flex-col gap-3">
                <h2 className="display m-0 text-2xl font-bold tracking-[-0.02em]">{s.heading}</h2>
                <div className="flex flex-col gap-3 text-base leading-relaxed text-[var(--pg-text-secondary)]">
                  {s.body.map((p, i) => <p key={i} className="m-0">{p}</p>)}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
