import Link from "next/link";
import { cityHref } from "../../lib/cities";
import { FAQ_GROUPS } from "../help/faqs";
import { reviewerName } from "./data";

// Landing sections reproduced from the design. Copy and visuals follow the
// mockup; anything that is data (cities, PG photos, reviews, FAQ answers)
// comes from our live data instead of the mockup's samples.

const H2 = ({ children, size = "clamp(38px, 4.6vw, 66px)", className = "", style }) => (
  <h2 className={`display m-0 font-extrabold ${className}`} style={{ fontSize: size, lineHeight: 1, letterSpacing: "-0.04em", ...style }}>{children}</h2>
);

const Check = ({ color = "#1F6B4A", size = 18 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

const Arrow = ({ bg, stroke, size = 44, icon = 18 }) => (
  <span className="arrow flex-none rounded-full grid place-items-center" aria-hidden="true" style={{ width: size, height: size, background: bg }}>
    <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  </span>
);

const search = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return `/propertys${q ? `?${q}` : ""}`;
};

/* ── Marquee: "PG in <city>" for cities with live listings ────────────────── */
export function CityMarquee({ cities }) {
  const names = (cities.length ? cities : ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kottayam"]).map((c) => `PG in ${c}`);
  const one = Array.from({ length: Math.max(1, Math.ceil(5 / names.length)) }, () => names).flat();
  const track = [...one, ...one];
  return (
    <div className="marquee pt-1 pb-11">
      <span className="sr">Cities covered: {cities.join(", ")}</span>
      <div className="mq-track" aria-hidden="true">
        {track.map((n, i) => (
          <span key={i} className="inline-flex items-center gap-10">
            <span className="display font-extrabold whitespace-nowrap" style={{ fontSize: "clamp(32px, 4vw, 56px)", letterSpacing: "-0.04em", ...(i % 2 ? { color: "transparent", WebkitTextStroke: "1.5px #10231F" } : { color: "#10231F" }) }}>
              {n}
            </span>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 1C13 9 15 11 23 12C15 13 13 15 12 23C11 15 9 13 1 12C9 11 11 9 12 1Z" fill="#C99A2E" /></svg>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Curated collections ──────────────────────────────────────────────────── */
export function Collections() {
  return (
    <section id="collections" className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-28">
      <div className="reveal flex flex-wrap justify-between items-end gap-6 mb-10">
        <div className="flex flex-col gap-3.5">
          <span className="eyebrow">Curated collections</span>
          <H2 className="max-w-[720px]">Tailored living spaces for every student need.</H2>
        </div>
        <Link href="/propertys" className="inline-flex items-center gap-2 text-[#10231F] no-underline font-bold text-base min-h-11">
          View All
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      </div>
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(270px, 100%), 1fr))" }}>
        <Link href={search({ sort: "distance" })} className="coll lift reveal" style={{ background: "#0F3B33", color: "#F5F3EE" }}>
          <div aria-hidden="true" className="relative h-[170px]">
            <div className="ripple absolute left-1/2 top-1/2 w-[150px] h-[150px] -ml-[75px] -mt-[75px] rounded-full" style={{ border: "2px solid #FFC447" }} />
            <div className="ripple r2 absolute left-1/2 top-1/2 w-[150px] h-[150px] -ml-[75px] -mt-[75px] rounded-full" style={{ border: "2px solid #FFC447" }} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
              <span className="display text-[56px] font-extrabold leading-none tracking-[-0.05em]" style={{ color: "#FFC447" }}>10</span>
              <span className="mono text-[11px] tracking-[.16em]" style={{ color: "rgba(245,243,238,.7)" }}>MIN</span>
            </div>
          </div>
          <div className="flex justify-between items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="display text-[26px] font-bold tracking-[-0.03em]">Walk-to-Campus</span>
              <span className="text-[15px]" style={{ color: "rgba(245,243,238,.75)" }}>Under 10 mins away</span>
            </div>
            <Arrow bg="#FFC447" stroke="#2A1C00" />
          </div>
        </Link>

        <Link href={search({ price: "Under ₹10k" })} className="coll lift reveal" style={{ background: "#F3D9CC", color: "#10231F" }}>
          <div aria-hidden="true" className="relative h-[170px] flex items-end justify-center gap-3">
            <span className="float w-[46px] h-[70px] rounded-[14px]" style={{ background: "rgba(180,70,31,.25)" }} />
            <span className="float f2 w-[46px] h-[110px] rounded-[14px]" style={{ background: "rgba(180,70,31,.5)" }} />
            <span className="float w-[46px] h-[150px] rounded-[14px] grid place-items-start justify-center pt-3 text-white font-extrabold text-[22px]" style={{ background: "#B4461F" }}>₹</span>
          </div>
          <div className="flex justify-between items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="display text-[26px] font-bold tracking-[-0.03em]">Budget Friendly</span>
              <span className="text-[15px]" style={{ color: "#5A3A2C" }}>Smart savings</span>
            </div>
            <Arrow bg="#10231F" stroke="#FFFFFF" />
          </div>
        </Link>

        <Link href={search({ sort: "rating" })} className="coll lift reveal btn-shine" style={{ background: "#FFC447", color: "#2A1C00" }}>
          <div aria-hidden="true" className="relative h-[170px] grid place-items-center">
            <span className="float w-[112px] h-[128px] grid place-items-center">
              <svg width="112" height="128" viewBox="0 0 24 27" fill="none" stroke="#2A1C00" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1.5l9.5 3.6v7.1c0 6-4.1 10.9-9.5 12.3C6.6 23.1 2.5 18.2 2.5 12.2V5.1z" fill="rgba(255,255,255,.35)" /><path d="M7.8 13l3 3 5.6-6" /></svg>
            </span>
          </div>
          <div className="flex justify-between items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="display text-[26px] font-bold tracking-[-0.03em]">Verified Luxury</span>
              <span className="text-[15px]" style={{ color: "#5A4300" }}>Premium experiences</span>
            </div>
            <Arrow bg="#2A1C00" stroke="#FFC447" />
          </div>
        </Link>

        <Link href={search({ gender: "Co-ed" })} className="coll lift reveal" style={{ background: "#FFFFFF", color: "#10231F" }}>
          <div aria-hidden="true" className="relative h-[170px]">
            <span className="float absolute rounded-full" style={{ left: "14%", top: "22%", width: 70, height: 70, background: "#D7E7E1", border: "4px solid #FFFFFF" }} />
            <span className="float f2 absolute rounded-full" style={{ left: "38%", top: "8%", width: 84, height: 84, background: "#0F3B33", border: "4px solid #FFFFFF" }} />
            <span className="float absolute rounded-full" style={{ left: "58%", top: "34%", width: 66, height: 66, background: "#F3D9CC", border: "4px solid #FFFFFF", animationDelay: "-3s" }} />
            <span className="absolute rounded-full px-3 py-1.5 text-xs font-bold" style={{ left: "30%", top: "66%", background: "#F5F3EE" }}>Movie night · Fri</span>
          </div>
          <div className="flex justify-between items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="display text-[26px] font-bold tracking-[-0.03em]">Social Hubs</span>
              <span className="text-[15px]" style={{ color: "#5B6762" }}>Vibrant communities</span>
            </div>
            <Arrow bg="#B4461F" stroke="#FFFFFF" />
          </div>
        </Link>
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────────────────────────── */
export function HowItWorks() {
  return (
    <section id="how" className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-28 pb-[120px]">
      <div className="reveal flex flex-wrap justify-between items-end gap-6 mb-14">
        <H2 className="max-w-[680px]">Three steps to your new university life.</H2>
        <div className="flex items-center gap-3.5 bg-white rounded-[22px] py-3.5 pl-3.5 pr-5" style={{ boxShadow: "0 18px 40px -26px rgba(16,35,31,.35)" }}>
          <span aria-hidden="true" className="w-11 h-11 rounded-[14px] grid place-items-center" style={{ background: "#E9F5EE" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
          </span>
          <span className="flex flex-col gap-0.5"><span className="font-bold text-base">Verified Status</span><span className="text-sm" style={{ color: "#5B6762" }}>Checked by our team</span></span>
        </div>
      </div>
      <ol className="list-none m-0 p-0 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))" }}>
        <li className="reveal lift bg-white rounded-[30px] p-8 flex flex-col gap-[22px] min-h-[360px]">
          <span className="display text-[15px] font-bold" style={{ color: "#B4461F" }}>01</span>
          <div aria-hidden="true" className="h-[140px] rounded-[20px] relative overflow-hidden" style={{ background: "#F0EDE4" }}>
            <div className="absolute left-1/2 top-1/2 w-[120px] h-[120px] -ml-[60px] -mt-[60px] rounded-full" style={{ border: "1.5px dashed rgba(180,70,31,.45)" }} />
            <div className="ripple absolute left-1/2 top-1/2 w-[120px] h-[120px] -ml-[60px] -mt-[60px] rounded-full" style={{ border: "2px solid #B4461F" }} />
            <div className="ripple r2 absolute left-1/2 top-1/2 w-[120px] h-[120px] -ml-[60px] -mt-[60px] rounded-full" style={{ border: "2px solid #B4461F" }} />
            <div className="absolute left-1/2 top-1/2 w-[22px] h-[22px] -ml-[11px] -mt-[11px] rounded-full" style={{ background: "#B4461F", boxShadow: "0 0 0 8px rgba(180,70,31,.15)" }} />
            {[["22%", "30%"], ["72%", "64%"], ["66%", "22%"]].map(([l, t]) => (
              <div key={l} className="absolute w-2.5 h-2.5 rounded-[9px] opacity-30" style={{ left: l, top: t, background: "#10231F" }} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="display m-0 text-[28px] font-bold tracking-[-0.03em]">Search with Intent</h3>
            <p className="m-0 text-base text-[var(--pg-text-secondary)]" style={{ lineHeight: 1.55 }}>Filter by distance, price, and lifestyle. Find exactly where you belong.</p>
          </div>
        </li>
        <li className="reveal lift bg-white rounded-[30px] p-8 flex flex-col gap-[22px] min-h-[360px]">
          <span className="display text-[15px] font-bold" style={{ color: "#B4461F" }}>02</span>
          <div aria-hidden="true" className="h-[140px] rounded-[20px] grid grid-cols-3 gap-2.5 p-4" style={{ background: "#F0EDE4" }}>
            <div className="rounded-xl" style={{ background: "#DCD6C6" }} />
            <div className="float rounded-xl" style={{ background: "#0F3B33", boxShadow: "0 10px 20px -8px rgba(15,59,51,.6)" }} />
            <div className="rounded-xl" style={{ background: "#DCD6C6" }} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="display m-0 text-[28px] font-bold tracking-[-0.03em]">Virtual or In-Person Visit</h3>
            <p className="m-0 text-base text-[var(--pg-text-secondary)]" style={{ lineHeight: 1.55 }}>Book a tour through our platform. No hidden surprises, just verified truth.</p>
          </div>
        </li>
        <li className="reveal lift rounded-[30px] p-8 flex flex-col gap-[22px] min-h-[360px]" style={{ background: "#0F3B33", color: "#F5F3EE" }}>
          <span className="display text-[15px] font-bold" style={{ color: "#FFC447" }}>03</span>
          <div aria-hidden="true" className="h-[140px] rounded-[20px] flex gap-3 items-center justify-center" style={{ background: "rgba(255,255,255,.06)" }}>
            <div className="w-10 h-[84px] rounded-[9px]" style={{ border: "1.5px solid rgba(255,255,255,.3)" }} />
            <div className="bed-free w-10 h-[84px] rounded-[9px]" style={{ background: "#FFD27A" }} />
            <div className="w-10 h-[84px] rounded-[9px]" style={{ border: "1.5px solid rgba(255,255,255,.3)" }} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="display m-0 text-[28px] font-bold tracking-[-0.03em]">Seamless Move-In</h3>
            <p className="m-0 text-base" style={{ lineHeight: 1.55, color: "rgba(245,243,238,.8)" }}>Handle all paperwork and first month&apos;s payment securely through PGCON.</p>
          </div>
        </li>
      </ol>
    </section>
  );
}

/* ── Browse by city (real cities; photo from a live PG in that city) ──────── */
const ML = {
  Kochi: "കൊച്ചി", Ernakulam: "എറണാകുളം", Thiruvananthapuram: "തിരുവനന്തപുരം", Kozhikode: "കോഴിക്കോട്",
  Thrissur: "തൃശ്ശൂർ", Kottayam: "കോട്ടയം", Alappuzha: "ആലപ്പുഴ", Kollam: "കൊല്ലം", Wayanad: "വയനാട്",
  Kannur: "കണ്ണൂർ", Palakkad: "പാലക്കാട്", Malappuram: "മലപ്പുറം", Pathanamthitta: "പത്തനംതിട്ട",
  Idukki: "ഇടുക്കി", Kasaragod: "കാസർഗോഡ്",
};
const TONES = [["#2F5D53", "#8EC2B4"], ["#8C5A3C", "#E0A77A"], ["#3B5A78", "#93B6D6"], ["#9A7420", "#E8C77E"], ["#5C4A7A", "#B3A1CF"]];

export function BrowseByCity({ cities, pgs }) {
  const list = cities.slice(0, 5);
  if (!list.length) return null;
  return (
    <section id="cities" className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-32">
      <div className="reveal flex flex-wrap justify-between items-end gap-6 mb-10">
        <div className="flex flex-col gap-3.5">
          <span className="eyebrow">Across Kerala</span>
          <H2>Browse PGs by city.</H2>
        </div>
        <p className="m-0 text-lg text-[var(--pg-text-secondary)] max-w-[380px]" style={{ lineHeight: 1.55 }}>From Thiruvananthapuram to Kozhikode, every listing is checked by our team before it goes live.</p>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}>
        {list.map((c, i) => {
          const [dark, light] = TONES[i % TONES.length];
          const photo = pgs.find((p) => p.city === c && p.photo)?.photo;
          const bg = photo
            ? { backgroundImage: `url("${photo}")` }
            : { background: `linear-gradient(160deg, ${light} 0%, ${dark} 100%)` };
          return (
            <Link key={c} href={cityHref(c)} className="city lift reveal" aria-label={`PGs in ${c}`}>
              <span className="zoom" style={bg} />
              <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(8,20,17,.72) 100%)" }} />
              {ML[c] && <span className="ml relative text-[15px]" style={{ color: "#FFD27A" }} lang="ml">{ML[c]}</span>}
              <span className="relative flex justify-between items-center gap-2.5">
                <span className="display text-[28px] font-extrabold tracking-[-0.03em] min-w-0 truncate">{c}</span>
                <Arrow bg="rgba(255,255,255,.92)" stroke="#10231F" size={40} icon={16} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ── For parents ──────────────────────────────────────────────────────────── */
const CHECKS = ["Owner ID and property papers", "CCTV at the gate", "Fire extinguisher on each floor", "Resident warden or caretaker", "Purified drinking water", "Kitchen hygiene walk-through"];

export function ForParents() {
  return (
    <section id="parents" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-32">
      <div className="grid gap-16 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(480px, 100%), 1fr))" }}>
        <div className="reveal flex flex-col gap-[22px] lg:sticky lg:top-[110px]">
          <span className="eyebrow">For parents</span>
          <H2 size="clamp(38px, 4.6vw, 64px)">You&apos;ll see what we saw when we visited.</H2>
          <p className="m-0 text-lg leading-relaxed text-[var(--pg-text-secondary)] max-w-[460px]">Sending your child to a new town is a big decision. Every PG on PGCON has been walked through by our team before it goes live.</p>
          {/* Restore once visit reports are built (after 350 PGs):
              "…and you can read the full visit report before a single rupee changes hands." */}
          <div className="kasavu w-[120px] mt-2" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-[18px]">
          <div className="reveal bg-white rounded-[30px] p-[30px] flex flex-col gap-[18px]" style={{ boxShadow: "0 24px 50px -32px rgba(16,35,31,.3)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span aria-hidden="true" className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: "#E9F5EE" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
                </span>
                <div className="flex flex-col gap-0.5">
                  <h3 className="display m-0 text-[22px] font-bold tracking-[-0.02em]">Verified in person</h3>
                  {/* Visit reports not built yet (after 350 PGs).
                  <span className="text-[13px]" style={{ color: "#5B6762" }}>Visit report · Meenachil House</span> */}
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#E9F5EE", color: "#1F6B4A" }}>All checks passed</span>
            </div>
            <ul className="list-none m-0 p-0 grid gap-x-5 gap-y-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}>
              {CHECKS.map((c) => <li key={c} className="flex items-center gap-2.5 text-[15px] font-medium"><Check />{c}</li>)}
            </ul>
          </div>
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
            <div className="reveal bg-white rounded-[30px] p-7 flex flex-col gap-3.5">
              <span aria-hidden="true" className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: "#FCEDE6" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B4461F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
              </span>
              <h3 className="display m-0 text-[22px] font-bold tracking-[-0.02em]">Secure Razorpay payments</h3>
              <p className="m-0 text-[15px] leading-relaxed text-[var(--pg-text-secondary)]">Deposits and rent go through Razorpay with UPI, cards or net banking. You get a receipt for every payment, and the refund terms are shown before you pay: <Link href="/terms">see our terms</Link>.</p>
            </div>
            <div className="reveal bg-white rounded-[30px] p-7 flex flex-col gap-3.5">
              <span aria-hidden="true" className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: "#FFF4D6" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9A6A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /></svg>
              </span>
              <h3 className="display m-0 text-[22px] font-bold tracking-[-0.02em]">Reviews from real residents</h3>
              <p className="m-0 text-[15px] leading-relaxed text-[var(--pg-text-secondary)]">Only students who booked and stayed through PGCON can leave a review. Owners can reply, but they can&apos;t edit or remove one.</p>
            </div>
          </div>
          {/* Parent share link not built yet (after 350 PGs).
          <div className="reveal rounded-[30px] px-7 py-[26px] flex flex-wrap items-center justify-between gap-[18px]" style={{ background: "#0F3B33", color: "#F5F3EE" }}>
            <div className="flex flex-col gap-1 max-w-[420px]">
              <span className="display text-xl font-bold">Share the bed with home before booking.</span>
              <span className="text-sm" style={{ color: "rgba(245,243,238,.75)" }}>Send a parent link with the floor plan, visit report and owner contact, no login needed.</span>
            </div>
            <Link href="/propertys" className="inline-flex items-center min-h-12 px-[22px] rounded-full font-bold text-[15px] no-underline" style={{ background: "#FFC447", color: "#2A1C00" }}>Send to a parent</Link>
          </div>
          */}
        </div>
      </div>
    </section>
  );
}

/* ── For owners ───────────────────────────────────────────────────────────── */
const OWNER_BEDS = [1, 1, 1, 0, 1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1, 0, 2, 1];
const badge = (bg, fg) => ({ fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 999, background: bg, color: fg });
const RENT_ROWS = [
  ["Bed 1A", "Paid 2 Oct", "Paid", badge("#E9F5EE", "#1F6B4A")],
  ["Bed 2A", "Due 5 Oct", "Due", badge("#FFF4D6", "#7A5300")],
  ["Bed 4C", "Due 5 Oct", "Overdue", badge("#FCEDE6", "#8E3415")],
];

export function ForOwners() {
  return (
    <section id="owners" className="px-4 sm:px-6 pb-32">
      <div className="reveal max-w-[1280px] mx-auto rounded-[44px] grid gap-14 items-center relative overflow-hidden text-white" style={{ background: "#B4461F", padding: "clamp(32px, 5vw, 72px)", gridTemplateColumns: "repeat(auto-fit, minmax(min(440px, 100%), 1fr))" }}>
        <div aria-hidden="true" className="absolute rounded-full" style={{ right: -120, top: -120, width: 380, height: 380, border: "2px solid rgba(255,255,255,.12)" }} />
        <div aria-hidden="true" className="absolute rounded-full" style={{ right: -60, top: -60, width: 260, height: 260, border: "2px solid rgba(255,255,255,.12)" }} />
        <div className="flex flex-col gap-[22px] relative">
          <span className="mono text-[13px] tracking-[.14em]" style={{ color: "#FFE1CF" }}>FOR PG OWNERS</span>
          <H2 size="clamp(38px, 4.6vw, 64px)">List your property and reach students across Kerala.</H2>
          <p className="m-0 text-lg leading-relaxed max-w-[480px]" style={{ color: "#FFEDE4" }}>
            Join our curated network of property owners providing high-quality student housing across Kerala. Then run every bed, payment and enquiry from one dashboard.
          </p>
          <ul className="list-none m-0 p-0 flex flex-col gap-3 text-base font-medium">
            {/* Not built yet (after 350 PGs): rent reminders; "Resident records, agreements and parent contacts in one place". */}
            {["Live bed board that updates your listing automatically", "Rent tracking and Razorpay collection"].map((t) => (
              <li key={t} className="flex gap-3 items-center"><Check color="#FFC447" size={20} />{t}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 mt-1.5">
            <Link href="/listProperty" className="inline-flex items-center min-h-[52px] px-[26px] rounded-full font-bold text-base no-underline bg-white" style={{ color: "#8E3415" }}>Get Started Now</Link>
            <Link href="/contact" className="inline-flex items-center min-h-[52px] px-[22px] rounded-full font-bold text-base no-underline text-white" style={{ border: "1.5px solid rgba(255,255,255,.6)" }}>Speak to an Expert</Link>
          </div>
        </div>
        <div role="img" aria-label="Owner dashboard preview" className="relative bg-white text-[#10231F] rounded-[28px] p-[22px] flex flex-col gap-[18px]" style={{ boxShadow: "0 40px 80px -30px rgba(60,15,0,.55)" }}>
          <div className="flex justify-between items-center gap-3">
            <span className="display font-bold text-lg">Meenachil House</span>
            <span className="mono text-[11px] tracking-[.08em]" style={{ color: "#5B6762" }}>OWNER DASHBOARD</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[["Beds filled", "17 / 20"], ["Rent due", "4"], ["New enquiries", "6"]].map(([k, v]) => (
              <div key={k} className="rounded-2xl p-3.5 flex flex-col gap-1" style={{ background: "#F5F3EE" }}><span className="text-xs" style={{ color: "#5B6762" }}>{k}</span><span className="display text-2xl font-extrabold">{v}</span></div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-bold" style={{ color: "#3E4E49" }}>Bed board · Floor 2</span>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}>
              {OWNER_BEDS.map((v, i) => (
                <span key={i} className="h-[26px] rounded-md" style={v === 1 ? { background: "#0F3B33" } : v === 2 ? { background: "#FFC447" } : { background: "#fff", border: "1.5px dashed #A9A396" }} />
              ))}
            </div>
          </div>
          <div className="flex flex-col" style={{ borderTop: "1px solid #ECE8DE" }}>
            {RENT_ROWS.map(([b, w, s, st]) => (
              <div key={b} className="flex justify-between items-center gap-3 py-[11px] text-sm" style={{ borderBottom: "1px solid #ECE8DE" }}>
                <span className="font-semibold">{b}</span><span style={{ color: "#5B6762" }}>{w}</span><span style={st}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials: real approved reviews only (hidden when there are none) ── */
const AVATARS = ["#D7E7E1", "#FFC447", "#F3D9CC"];

export function Testimonials({ reviews }) {
  if (!reviews.length) return null;
  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-32">
      <div className="reveal flex flex-col gap-3.5 mb-12">
        <span className="eyebrow">From students and parents</span>
        <H2>Moved in. Didn&apos;t move out.</H2>
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}>
        {reviews.slice(0, 3).map((r, i) => {
          const dark = i === 1;
          return (
            <figure key={r.id} className="reveal m-0 rounded-[30px] p-8 flex flex-col justify-between gap-7 min-h-[300px]" style={dark ? { background: "#0F3B33", color: "#F5F3EE" } : { background: "#fff" }}>
              <blockquote className="display m-0 text-2xl tracking-[-0.02em] font-semibold" style={{ lineHeight: 1.3 }}>“{r.comment}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <span aria-hidden="true" className="w-11 h-11 rounded-full shrink-0" style={{ background: AVATARS[i % 3] }} />
                <span className="flex flex-col gap-0.5">
                  <span className="font-bold">{reviewerName(r)}</span>
                  <span className="text-[13px]" style={{ color: dark ? "rgba(245,243,238,.7)" : "#5B6762" }}>
                    {[r.property?.name, r.property?.city].filter(Boolean).join(" · ") || "PGCON resident"}
                  </span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/* ── FAQ: design layout, answers from the Help Center (accurate policies) ── */
export function Faq() {
  const items = FAQ_GROUPS.flatMap((g) => g.items).slice(0, 6);
  return (
    <section id="faq" className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-32">
      <div className="grid gap-14 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))" }}>
        <div className="reveal flex flex-col gap-4">
          <span className="eyebrow">FAQ</span>
          <H2 size="clamp(38px, 4.6vw, 60px)">Questions we hear every June.</H2>
          <p className="m-0 text-[17px] leading-relaxed text-[var(--pg-text-secondary)]">Still unsure? <Link href="/contact">Contact us</Link> and we&apos;ll help.</p>
        </div>
        <div className="flex flex-col gap-2.5">
          {items.map((q) => (
            <details key={q.q} className="reveal bg-white rounded-[22px] px-6">
              <summary className="flex justify-between items-center gap-4 py-[22px] text-lg font-bold min-h-11">
                {q.q}
                <span className="faq-plus flex-none w-[34px] h-[34px] rounded-full grid place-items-center transition-transform" style={{ background: "#F5F3EE" }} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10231F" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="m-0 pb-[22px] text-base leading-relaxed text-[var(--pg-text-secondary)] max-w-[620px]">{q.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────────────────────────── */
export function FinalCta() {
  return (
    <section className="px-4 sm:px-6 pb-24">
      <div className="reveal max-w-[1280px] mx-auto rounded-[44px] relative overflow-hidden flex flex-col items-start gap-7" style={{ background: "#10231F", color: "#F5F3EE", padding: "clamp(40px, 7vw, 104px) clamp(24px, 6vw, 88px)" }}>
        <div aria-hidden="true" className="absolute pointer-events-none rounded-[30px]" style={{ inset: 18, borderTop: "2px solid rgba(201,154,46,.55)", borderBottom: "1px solid rgba(201,154,46,.55)" }} />
        {/* Decorative beds: hidden on phones, where they'd sit on top of the buttons. */}
        <div aria-hidden="true" className="absolute hidden md:flex gap-3.5 opacity-90" style={{ right: "clamp(-40px, 2vw, 60px)", bottom: 40 }}>
          {["s1", "s2", "s3"].map((s) => <span key={s} className={`seq ${s} w-[54px] h-[120px] rounded-xl`} style={{ border: "1.5px solid rgba(255,255,255,.2)" }} />)}
        </div>
        <h2 className="display m-0 font-extrabold relative max-w-[820px]" style={{ fontSize: "clamp(44px, 6.4vw, 96px)", lineHeight: 0.95, letterSpacing: "-0.045em" }}>
          Admissions are open.<br /><span style={{ color: "#FFC447" }}>The good beds go first.</span>
        </h2>
        <p className="m-0 text-[19px] max-w-[520px] relative" style={{ lineHeight: 1.55, color: "rgba(245,243,238,.78)" }}>Pick your college and see which beds are glowing right now.</p>
        <div className="flex flex-wrap gap-3 relative">
          <Link href="/propertys" className="btn-shine inline-flex items-center min-h-14 px-[30px] rounded-full font-bold text-[17px] text-white no-underline" style={{ background: "#B4461F" }}>Find my bed</Link>
          <Link href="/listProperty" className="inline-flex items-center min-h-14 px-[26px] rounded-full font-bold text-[17px] no-underline" style={{ color: "#F5F3EE", border: "1.5px solid rgba(245,243,238,.45)" }}>I own a PG</Link>
        </div>
      </div>
    </section>
  );
}
