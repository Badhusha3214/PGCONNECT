import { LogoMark } from "../components/Logo";

export const metadata = {
  robots: { index: false, follow: false },
  title: "You're offline",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <div className="max-w-[520px] w-full rounded-[36px] p-10 flex flex-col items-center text-center gap-5" style={{ background: "var(--pg-forest)", color: "#F5F3EE" }}>
        <LogoMark size={48} />
        <span className="mono text-[13px] tracking-[.14em]" style={{ color: "var(--pg-lamp)" }}>NO CONNECTION</span>
        <h1 className="display m-0 text-4xl font-extrabold tracking-[-0.04em]">You&apos;re offline.</h1>
        <p className="m-0 text-base" style={{ color: "rgba(245,243,238,.78)", lineHeight: 1.55 }}>
          Check your connection and try again. Pages you&apos;ve already visited may still be available.
        </p>
        <div className="kasavu w-24 mt-2" aria-hidden="true" />
      </div>
    </div>
  );
}
