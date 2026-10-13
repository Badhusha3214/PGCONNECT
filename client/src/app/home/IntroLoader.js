// Intro loader from the design: a floor plan draws itself, beds pop in and one
// lights up, then the panels split open. Pure CSS (globals.css .ld-*); it is
// skipped after the first visit in a session via html[data-intro="seen"],
// which INTRO_SEEN_SCRIPT sets before first paint (see app/page.js).

export const INTRO_SEEN_SCRIPT = `try{var k='pg-intro-seen';if(sessionStorage.getItem(k)){document.documentElement.setAttribute('data-intro','seen')}else{sessionStorage.setItem(k,'1')}}catch(e){}`;

export default function IntroLoader() {
  return (
    <div className="ld" aria-hidden="true">
      <div className="ld-panel ld-top" />
      <div className="ld-panel ld-bot" />
      <div className="ld-rain" />
      <div className="ld-rain r2" />
      <div className="ld-seam" />
      <div className="ld-inner">
        <div className="flex items-center gap-2.5">
          <span className="grid place-content-center" style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,.08)", gridTemplateColumns: "repeat(2, 8px)", gap: 4 }}>
            <span style={{ width: 8, height: 12, borderRadius: 3, background: "rgba(255,255,255,.3)" }} />
            <span style={{ width: 8, height: 12, borderRadius: 3, background: "#FFC447", boxShadow: "0 0 10px #FFC447" }} />
          </span>
          <span className="display font-extrabold text-[19px] tracking-[-0.02em]">PGCON</span>
        </div>
        <svg viewBox="0 0 240 200" style={{ width: 260, height: "auto", overflow: "visible" }}>
          <g className="ld-wall" stroke="#EDE7D6" strokeWidth="4" fill="none" strokeLinecap="square">
            <path pathLength="1" d="M10 10H230V190H10Z" />
            <path pathLength="1" d="M120 10V100" />
            <path pathLength="1" d="M10 100H50M80 100H170M200 100H230" />
            <path pathLength="1" d="M90 130V190M150 130V190M10 130H30M60 130H230" />
          </g>
          <g fill="rgba(255,255,255,.08)" stroke="rgba(237,231,214,.55)" strokeWidth="1.2">
            <rect className="ld-bed" style={{ animationDelay: "1s" }} x="22" y="22" width="24" height="50" rx="5" />
            <rect className="ld-bed" style={{ animationDelay: "1.08s" }} x="52" y="22" width="24" height="50" rx="5" />
            <rect className="ld-bed" style={{ animationDelay: "1.16s" }} x="82" y="22" width="24" height="50" rx="5" />
            <rect className="ld-bed" style={{ animationDelay: "1.24s" }} x="134" y="22" width="24" height="50" rx="5" />
            <rect className="ld-bed ld-mine" x="196" y="22" width="24" height="50" rx="5" />
            <rect className="ld-bed" style={{ animationDelay: "1.4s" }} x="22" y="140" width="24" height="44" rx="5" />
            <rect className="ld-bed" style={{ animationDelay: "1.46s" }} x="170" y="150" width="46" height="26" rx="6" />
          </g>
          <circle className="ld-halo" cx="208" cy="47" r="22" fill="none" stroke="#FFC447" strokeWidth="2" />
        </svg>
        <div className="ld-msgs display font-bold tracking-[-0.02em]" style={{ fontSize: "clamp(20px, 3vw, 28px)" }}>
          <span className="ld-m1">Drawing the floor plan…</span>
          <span className="ld-m2">Checking which beds are free…</span>
          <span className="ld-m3">Found yours. <span className="ml font-bold" style={{ color: "#FFC447" }} lang="ml">നിങ്ങളുടെ കിടക്ക</span></span>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="ld-bar"><span /></div>
          <span className="ld-count" />
        </div>
        <span className="mono absolute left-7 bottom-6 text-[11px] tracking-[.2em]" style={{ color: "rgba(245,243,238,.5)" }}>KERALA · INDIA</span>
        <span className="mono absolute right-7 bottom-6 text-[11px] tracking-[.2em]" style={{ color: "rgba(245,243,238,.5)" }}>2026–27 BEDS</span>
      </div>
    </div>
  );
}
