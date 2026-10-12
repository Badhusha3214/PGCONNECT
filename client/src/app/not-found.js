import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "Page Not Found",
};

// A tiny floor plan where every bed is taken and the one you wanted is a
// dashed outline — the 404 in the landing design's visual language.
function MissingBed() {
  const bed = (x, taken) => (
    <rect key={x} x={x} y="34" width="44" height="82" rx="8" fill={taken ? "rgba(255,255,255,.06)" : "none"} stroke={taken ? "rgba(237,231,214,.4)" : "#FFC447"} strokeWidth={taken ? 1.5 : 2.5} strokeDasharray={taken ? undefined : "6 6"} />
  );
  return (
    <svg viewBox="0 0 320 150" className="w-full max-w-[420px] h-auto" aria-hidden="true">
      <rect x="10" y="10" width="300" height="130" rx="6" fill="none" stroke="#EDE7D6" strokeWidth="4" />
      {[30, 86, 142].map((x) => bed(x, true))}
      {bed(198, false)}
      {bed(254, true)}
      <text x="220" y="80" textAnchor="middle" fontFamily="var(--font-jetbrains), monospace" fontSize="18" fontWeight="700" fill="#FFC447">?</text>
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <Navbar />
      <main id="main-content" className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-[44px] grid gap-10 items-center" style={{ background: "var(--pg-forest)", color: "#F5F3EE", padding: "clamp(32px, 6vw, 88px)", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))" }}>
          <div className="flex flex-col gap-6">
            <span className="mono text-[13px] tracking-[.14em]" style={{ color: "var(--pg-lamp)" }}>ERROR 404</span>
            <h1 className="display m-0 font-extrabold" style={{ fontSize: "clamp(44px, 6vw, 88px)", lineHeight: 0.95, letterSpacing: "-0.045em" }}>
              This bed doesn&apos;t <span style={{ color: "var(--pg-lamp)" }}>exist.</span>
            </h1>
            <p className="m-0 text-lg" style={{ color: "rgba(245,243,238,.78)", lineHeight: 1.55 }}>The page or listing may have been removed, or the link is incorrect. Plenty of real ones are still free.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/propertys" className="inline-flex items-center min-h-[52px] px-6 rounded-full font-bold text-base text-white no-underline" style={{ background: "var(--pg-terracotta)" }}>Browse PGs</Link>
              <Link href="/" className="inline-flex items-center min-h-[52px] px-6 rounded-full font-bold text-base no-underline" style={{ color: "#F5F3EE", border: "1.5px solid rgba(245,243,238,.45)" }}>Back home</Link>
            </div>
          </div>
          <div className="flex justify-center"><MissingBed /></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
