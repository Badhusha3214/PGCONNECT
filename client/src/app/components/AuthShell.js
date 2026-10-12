import Link from "next/link";
import Logo from "./Logo";

// Shared form styles for auth pages, in the landing design's language.
export const labelCls = "block text-xs font-bold tracking-[.08em] uppercase text-[var(--pg-text-tertiary)] mb-1.5";
export const inputCls =
  "w-full rounded-[16px] border-[1.5px] border-[rgba(16,35,31,.14)] bg-white px-4 py-3.5 text-base text-[var(--pg-ink)] placeholder:text-[#8A9590] outline-none transition-colors hover:border-[rgba(16,35,31,.3)] focus:border-[var(--pg-terracotta)]";
export const primaryBtnCls =
  "btn-shine w-full inline-flex items-center justify-center gap-2 min-h-[52px] rounded-full text-white font-bold text-base cursor-pointer disabled:opacity-60 transition-opacity";

const BEDS = [0, 0, 1, 0, 0, 0, 1, 0];

// Two-column auth layout: forest brand panel with the lit-bed motif on the
// left, the form card on the right. Collapses to just the card on mobile.
export default function AuthShell({ eyebrow, title, accent, intro, children, footer, aside }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 xl:p-16" style={{ background: "var(--pg-forest)", color: "#F5F3EE" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1.2px, transparent 1.5px)", backgroundSize: "22px 22px" }} />
        <Link href="/" className="relative inline-flex items-center gap-2.5 no-underline" style={{ color: "#F5F3EE" }}>
          <span className="inline-grid place-content-center w-[38px] h-[38px] rounded-xl" style={{ background: "rgba(255,255,255,.08)", gridTemplateColumns: "repeat(2, 9px)", gap: 4 }}>
            <span style={{ width: 9, height: 13, borderRadius: 3, background: "rgba(255,255,255,.28)" }} />
            <span style={{ width: 9, height: 13, borderRadius: 3, background: "#FFC447", boxShadow: "0 0 10px #FFC447" }} />
          </span>
          <span className="display font-extrabold text-[21px] tracking-[-0.02em]">PG Connect</span>
        </Link>

        <div className="relative flex flex-col gap-8 max-w-[520px]">
          {aside || (
            <>
              <h2 className="display m-0 font-extrabold" style={{ fontSize: "clamp(40px, 4vw, 64px)", lineHeight: 0.95, letterSpacing: "-0.045em" }}>
                Your bed is <span style={{ color: "var(--pg-lamp)" }}>waiting.</span>
              </h2>
              <p className="m-0 text-lg" style={{ color: "rgba(245,243,238,.78)", lineHeight: 1.55 }}>
                Verified PGs across Kerala, real bed availability and transparent rent — all in one place.
              </p>
            </>
          )}
          <div className="grid gap-2.5" aria-hidden="true" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
            {BEDS.map((lit, i) => (
              <span key={i} className={`h-[72px] rounded-[10px] ${lit ? "bed-free" : ""}`} style={lit ? { background: "#FFD27A" } : { border: "1.5px solid rgba(255,255,255,.25)" }} />
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 mono text-[11px] tracking-[.2em]" style={{ color: "rgba(245,243,238,.5)" }}>
          <span>KERALA · INDIA</span>
          <span className="ml text-sm tracking-normal" style={{ color: "#FFD27A" }} lang="ml">നിങ്ങളുടെ കിടക്ക</span>
        </div>
      </aside>

      <main id="main-content" className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-5 sm:px-8 py-5">
          <span className="lg:hidden"><Logo size={34} /></span>
          <Link href="/" className="ml-auto text-sm font-semibold text-[var(--pg-text-secondary)] no-underline hover:text-[var(--pg-ink)]">← Back to home</Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 pb-12">
          <div className="w-full max-w-[460px] flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              <h1 className="display m-0 font-extrabold" style={{ fontSize: "clamp(38px, 4vw, 52px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                {title}{accent && <> <span style={{ color: "var(--pg-terracotta)" }}>{accent}</span></>}
              </h1>
              {intro && <p className="m-0 text-base text-[var(--pg-text-secondary)]" style={{ lineHeight: 1.55 }}>{intro}</p>}
            </div>
            {children}
            {footer}
          </div>
        </div>
        <div className="px-5 sm:px-8 py-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--pg-text-tertiary)]">
          <span>© {new Date().getFullYear()} PG Connect</span>
          <Link href="/privacy" className="text-[var(--pg-text-tertiary)]">Privacy</Link>
          <Link href="/terms" className="text-[var(--pg-text-tertiary)]">Terms</Link>
          <Link href="/cookie-policy" className="text-[var(--pg-text-tertiary)]">Cookies</Link>
        </div>
      </main>
    </div>
  );
}
