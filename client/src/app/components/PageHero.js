// Page header in the landing design's language: mono eyebrow, big Bricolage
// headline (optionally with a terracotta accent), intro copy, dotted backdrop.
export default function PageHero({ eyebrow, title, accent, intro, children, align = "left", size = "clamp(44px, 5.4vw, 80px)" }) {
  const center = align === "center";
  return (
    <section className={`relative max-w-[1280px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 ${center ? "text-center" : ""}`}>
      <div className="dots absolute pointer-events-none" aria-hidden="true" style={{ top: -40, bottom: 0, left: -200, right: -200 }} />
      <div className={`relative flex flex-col gap-5 ${center ? "items-center mx-auto" : ""} max-w-[860px]`}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="display m-0 font-extrabold" style={{ fontSize: size, lineHeight: 0.98, letterSpacing: "-0.045em", textWrap: "balance" }}>
          {title}
          {accent && <> <span style={{ color: "var(--pg-terracotta)" }}>{accent}</span></>}
        </h1>
        {intro && <p className="m-0 text-lg sm:text-xl text-[var(--pg-text-secondary)] max-w-[620px]" style={{ lineHeight: 1.55 }}>{intro}</p>}
        {children}
      </div>
    </section>
  );
}
