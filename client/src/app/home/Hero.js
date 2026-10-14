"use client";
import { useState } from "react";
import Link from "next/link";
import { cityHref } from "../../lib/cities";
import { useRouter } from "next/navigation";

// Price bands exactly as in the design; values are the labels the search
// page (/propertys?price=…) already understands.
const PRICES = [
  { label: "Under ₹10k", value: "Under ₹10k" },
  { label: "₹10k – ₹20k", value: "₹10k–₹20k" },
  { label: "Above ₹20k", value: "Above ₹20k" },
];
const GENDERS = ["Boys", "Girls", "Co-ed"];

const pill = (on) =>
  `border-0 rounded-full px-4 min-h-10 text-sm font-bold cursor-pointer transition-colors ${on ? "bg-[var(--pg-ink)] text-white" : "bg-transparent text-[var(--pg-text-secondary)]"}`;

const Word = ({ i, children, style }) => (
  <span className="w"><span className={`i${i}`} style={style}>{children}</span></span>
);

const TRUST = [
  { label: "Every PG visited in person", d: <><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></> },
  { label: "Bed deposits via Razorpay", d: <><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /></> },
  { label: "Reviews from real residents", d: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /> },
];

const labelCls = "text-xs font-bold tracking-[.08em] uppercase text-[var(--pg-text-tertiary)]";
const selectCls = "border-0 bg-transparent text-base font-semibold text-[var(--pg-ink)] py-0.5 min-h-7 outline-none cursor-pointer";

export default function Hero({ cities }) {
  const router = useRouter();
  const [city, setCity] = useState(cities[0] || "");
  const [price, setPrice] = useState(PRICES[0].value);
  const [gender, setGender] = useState("Girls");

  const onSearch = (e) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (city) q.set("location", city);
    q.set("price", price);
    q.set("gender", gender);
    router.push(`/propertys?${q}`);
  };

  return (
    <section id="top" className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-14 pb-24 relative">
      <div className="dots absolute pointer-events-none" aria-hidden="true" style={{ top: -40, bottom: 0, left: -200, right: -200 }} />
      <div className="grid gap-14 items-center relative" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(500px, 100%), 1fr))" }}>
        <div className="flex flex-col gap-7">
          <div className="hin i1 flex items-center gap-3 text-sm font-semibold text-[var(--pg-text-secondary)]">
            <span className="inline-flex items-center gap-2 bg-white border border-[rgba(16,35,31,.1)] rounded-full py-[7px] pl-2 pr-3.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#2E9E6B", boxShadow: "0 0 0 4px rgba(46,158,107,.18)" }} />
              Verified listings in Kerala
            </span>
            <span className="ml text-[17px] text-[var(--pg-terracotta)]" lang="ml">കേരളം</span>
          </div>

          <h1 className="display m-0 font-extrabold" aria-label="Find your perfect PG near your campus." style={{ fontSize: "clamp(50px, 6vw, 96px)", lineHeight: 0.95, letterSpacing: "-0.045em" }}>
            <span aria-hidden="true">
              <Word i={2}>Find</Word> <Word i={3}>your</Word> <Word i={4}>perfect</Word> <Word i={5}>PG</Word>
              <br />
              <Word i={6}>near</Word> <Word i={6}>your</Word>{" "}
              <span className="relative inline-block">
                <Word i={7} style={{ color: "var(--pg-terracotta)" }}>campus.</Word>
                <svg className="uline absolute left-0 w-full overflow-visible" aria-hidden="true" viewBox="0 0 300 24" preserveAspectRatio="none" style={{ bottom: "-0.06em", height: "0.2em" }}>
                  <path pathLength="1" d="M4 16 C 70 4, 150 4, 296 12" fill="none" stroke="#C99A2E" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h1>

          <p className="hin i6 m-0 text-xl text-[var(--pg-text-secondary)] max-w-[520px]" style={{ lineHeight: 1.55, textWrap: "pretty" }}>
            Kerala&apos;s trusted PG marketplace for students. Verified listings, transparent pricing, and a referral program that rewards your network.
          </p>

          <form id="search" onSubmit={onSearch} className="hin i7 bg-white rounded-[28px] p-2.5 flex flex-col gap-2" aria-label="Search PGs" style={{ boxShadow: "0 30px 70px -30px rgba(16,35,31,.35), 0 1px 0 rgba(16,35,31,.06)" }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))" }}>
              <label className="flex flex-col gap-1 px-4 py-3 rounded-[18px] bg-[#F5F3EE]">
                <span className={labelCls}>Location</span>
                <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 px-4 py-3 rounded-[18px] bg-[#F5F3EE]">
                <span className={labelCls}>Price range</span>
                <select value={price} onChange={(e) => setPrice(e.target.value)} className={selectCls}>
                  {PRICES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2.5 pl-2 pr-1 py-1">
              <div role="group" aria-label="Gender" className="flex gap-1 bg-[#F5F3EE] rounded-full p-1">
                {GENDERS.map((g) => (
                  <button key={g} type="button" aria-pressed={gender === g} onClick={() => setGender(g)} className={pill(gender === g)}>{g}</button>
                ))}
              </div>
              <button type="submit" className="btn-shine inline-flex items-center gap-2.5 text-white border-0 rounded-full px-[26px] min-h-[52px] text-base font-bold cursor-pointer" style={{ background: "#B4461F", boxShadow: "0 12px 28px -10px rgba(180,70,31,.7)" }}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                Search
              </button>
            </div>
          </form>

          <div className="hin i8 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-[var(--pg-text-secondary)] mr-1">Popular:</span>
            {cities.slice(0, 4).map((c) => (
              <Link key={c} href={cityHref(c)} className="text-[var(--pg-ink)] no-underline bg-white border border-[rgba(16,35,31,.12)] rounded-full px-3.5 min-h-10 inline-flex items-center font-semibold hover:border-[var(--pg-ink)] transition-colors">
                PG in {c}
              </Link>
            ))}
          </div>

          <div className="hin i8 flex flex-wrap gap-x-[26px] gap-y-2.5 text-sm font-medium text-[var(--pg-text-secondary)]">
            {TRUST.map((t) => (
              <span key={t.label} className="inline-flex items-center gap-2">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.d}</svg>
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Hero visual: lamp-lit floor plan */}
        <div className="hin i3 relative">
          <div className="float absolute z-[3]" aria-hidden="true" style={{ top: "16%", right: -18 }}>
            <div className="hin i10 flex items-center gap-2 bg-white text-[var(--pg-ink)] rounded-full px-3.5 py-[9px] text-[13px] font-bold" style={{ boxShadow: "0 18px 40px -16px rgba(16,35,31,.45)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#2E9E6B" }} />Bedmate: quiet studier
            </div>
          </div>
          <div className="float f2 absolute z-[3]" aria-hidden="true" style={{ top: "48%", left: -26 }}>
            <div className="hin i10 flex items-center gap-2 rounded-full px-3.5 py-[9px] text-[13px] font-bold" style={{ background: "#FFC447", color: "#2A1C00", boxShadow: "0 18px 40px -16px rgba(120,80,0,.5)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2" /><path d="M9 21l2-6 3 3v3M7 12l3-4 4 1 3 3" /></svg>
              6 min to campus
            </div>
          </div>

          <div className="relative rounded-[36px] p-7 overflow-hidden" style={{ background: "#0F3B33", boxShadow: "0 50px 100px -40px rgba(15,59,51,.65)" }}>
            <FloorPlan />
            <div className="hin i9 absolute top-6 left-6 flex items-center gap-2.5 rounded-full py-2 pl-2.5 pr-4 text-[13px] font-semibold" style={{ background: "rgba(16,35,31,.72)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: "#F5F3EE", border: "1px solid rgba(255,255,255,.14)" }}>
              <span className="w-[22px] h-[22px] rounded-full grid place-items-center text-xs font-extrabold" style={{ background: "#FFC447", color: "#3A2600" }}>3</span>
              beds free · Floor 2, Meenachil House
            </div>
          </div>

          <div className="hin i10 absolute bg-white rounded-3xl p-[18px] flex flex-col gap-3" style={{ right: -8, bottom: -36, width: "min(300px, 82%)", boxShadow: "0 30px 60px -20px rgba(16,35,31,.45)" }}>
            <div className="flex justify-between items-start gap-3">
              <div className="flex flex-col gap-[3px]">
                <span className="mono text-xs tracking-[.06em]" style={{ color: "#B4461F" }}>BED 2B · ROOM 2</span>
                <span className="display text-xl font-bold tracking-[-0.02em]">Window side, double</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-[5px] rounded-full whitespace-nowrap" style={{ background: "#E9F5EE", color: "#1F6B4A" }}>Free now</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span><span className="display text-[26px] font-extrabold">₹6,500</span><span className="text-sm" style={{ color: "#5B6762" }}> / month</span></span>
              <span className="text-[13px] text-[var(--pg-text-secondary)]">6 min to campus</span>
            </div>
            <Link href="/propertys" className="text-center rounded-[14px] p-[13px] font-bold text-[15px] text-white no-underline" style={{ background: "#10231F" }}>
              Hold this bed
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloorPlan() {
  return (
    <svg role="img" aria-label="Top-down floor plan of a PG floor with three free beds glowing" viewBox="0 0 600 560" className="block w-full h-auto">
      <defs>
        <pattern id="hgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.045)" strokeWidth="1" /></pattern>
        <radialGradient id="hglow"><stop offset="0" stopColor="#FFC447" stopOpacity=".9" /><stop offset="1" stopColor="#FFC447" stopOpacity="0" /></radialGradient>
        <linearGradient id="scanG" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#FFC447" stopOpacity="0" /><stop offset=".85" stopColor="#FFC447" stopOpacity=".22" /><stop offset="1" stopColor="#FFE7A8" stopOpacity=".9" /></linearGradient>
      </defs>
      <rect width="600" height="560" fill="url(#hgrid)" />
      <rect x="40" y="40" width="520" height="480" fill="rgba(255,255,255,.035)" />
      <rect x="40" y="262" width="520" height="66" fill="rgba(255,255,255,.02)" />
      <g className="hdraw" stroke="#EDE7D6" strokeWidth="6" strokeLinecap="square" fill="none">
        <path pathLength="1" d="M40 40H560V520H40Z" />
        <path pathLength="1" d="M300 40V262" />
        <path pathLength="1" d="M40 262H140M190 262H400M450 262H560" />
        <path pathLength="1" d="M40 328H90M140 328H220M220 328H330M370 328H560" />
        <path pathLength="1" d="M220 328V520M330 328V520" />
      </g>
      <g className="hpop i10" stroke="#8FD3C7" strokeWidth="6"><path d="M90 40H170M380 40H480M560 120V200M40 400V470" /></g>
      <g stroke="rgba(237,231,214,.45)" strokeWidth="1.5" fill="none">
        <path d="M140 262A50 50 0 0 0 190 212" /><path d="M400 262A50 50 0 0 0 450 212" /><path d="M90 328A50 50 0 0 1 140 378" />
      </g>
      <g fontFamily="var(--font-jetbrains), monospace" fontSize="11" fill="rgba(237,231,214,.6)" letterSpacing="1.5">
        <text x="60" y="246">ROOM 1 · TRIPLE</text><text x="320" y="246">ROOM 2 · DOUBLE</text><text x="240" y="300">CORRIDOR</text>
        <text x="60" y="505">ROOM 3 · SINGLE</text><text x="244" y="505">BATH</text><text x="350" y="505">DINING</text>
      </g>
      <circle className="glowdot" cx="256" cy="125" r="70" fill="url(#hglow)" />
      <circle className="glowdot d2" cx="506" cy="125" r="70" fill="url(#hglow)" />
      <circle className="glowdot d3" cx="96" cy="435" r="70" fill="url(#hglow)" />
      <g className="hpop i8" fill="rgba(255,255,255,.06)" stroke="rgba(237,231,214,.35)" strokeWidth="1.5">
        <rect x="66" y="70" width="60" height="110" rx="9" /><rect x="74" y="78" width="44" height="18" rx="5" />
        <rect x="146" y="70" width="60" height="110" rx="9" /><rect x="154" y="78" width="44" height="18" rx="5" />
        <rect x="330" y="70" width="60" height="110" rx="9" /><rect x="338" y="78" width="44" height="18" rx="5" />
      </g>
      <g className="hpop i9" fill="none" stroke="rgba(237,231,214,.28)" strokeWidth="1.5">
        <rect x="404" y="70" width="58" height="36" rx="4" /><rect x="150" y="345" width="56" height="30" rx="4" />
        <circle cx="258" cy="372" r="14" /><rect x="290" y="350" width="26" height="40" rx="10" />
        <rect x="390" y="380" width="130" height="64" rx="12" />
        <circle cx="408" cy="368" r="7" /><circle cx="455" cy="368" r="7" /><circle cx="502" cy="368" r="7" />
        <circle cx="408" cy="456" r="7" /><circle cx="455" cy="456" r="7" /><circle cx="502" cy="456" r="7" />
      </g>
      <g className="hpop i10" fill="#FFD27A" stroke="#FFF0C9" strokeWidth="2">
        <rect x="226" y="70" width="60" height="110" rx="9" /><rect x="476" y="70" width="60" height="110" rx="9" /><rect x="66" y="380" width="60" height="110" rx="9" />
      </g>
      <g className="hpop i10" fill="#FFF6DE">
        <rect x="234" y="78" width="44" height="18" rx="5" /><rect x="484" y="78" width="44" height="18" rx="5" /><rect x="74" y="388" width="44" height="18" rx="5" />
      </g>
      <g className="hpop i10"><rect className="march" x="470" y="64" width="72" height="122" rx="13" fill="none" stroke="#FF8A5C" strokeWidth="2.5" /></g>
      <g className="hpop i10" fontFamily="var(--font-jetbrains), monospace" fontSize="12" fontWeight="600" fill="#5A3A00" textAnchor="middle">
        <text x="256" y="160">1C</text><text x="506" y="160">2B</text><text x="96" y="470">3A</text>
      </g>
      <g className="hpop i10"><path className="march" d="M165 296 H 506 V 196" fill="none" stroke="rgba(255,138,92,.7)" strokeWidth="2" /></g>
      <circle className="walker" r="7" fill="#FF8A5C" stroke="#FFFFFF" strokeWidth="2.5" />
      <rect className="scan" x="20" y="40" width="40" height="480" fill="url(#scanG)" />
    </svg>
  );
}
