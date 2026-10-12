"use client";
import { useState } from "react";
import Link from "next/link";
import { rupees, bedsLeftLabel } from "./data";

const chip = (on) =>
  `rounded-full px-[18px] min-h-11 text-[15px] font-semibold cursor-pointer border-[1.5px] ${on ? "bg-[#10231F] text-white border-[#10231F]" : "bg-white text-[#10231F] border-[rgba(16,35,31,.18)]"}`;

const Walk = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B4461F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2" /><path d="M9 21l2-6 3 3v3M7 12l3-4 4 1 3 3" /></svg>
);

// "Top rated properties" — the design's card layout filled with live listings.
export default function FeaturedPGs({ pgs, cities }) {
  const filterCities = cities.filter((c) => pgs.some((p) => p.city === c)).slice(0, 4);
  const [city, setCity] = useState("all");
  const shown = pgs.filter((p) => city === "all" || p.city === city).slice(0, 6);

  return (
    <section id="featured" className="bg-white pt-10 pb-32">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col gap-10">
        <div className="reveal flex flex-wrap justify-between items-end gap-6">
          <div className="flex flex-col gap-3.5">
            <span className="eyebrow">Top rated properties</span>
            <h2 className="display m-0 font-extrabold" style={{ fontSize: "clamp(38px, 4.6vw, 66px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
              Discover the best<br />PGs in Kerala.
            </h2>
          </div>
          <div role="group" aria-label="Filter by city" className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={city === "all"} onClick={() => setCity("all")} className={chip(city === "all")}>All cities</button>
            {filterCities.map((c) => (
              <button key={c} type="button" aria-pressed={city === c} onClick={() => setCity(c)} className={chip(city === c)}>{c}</button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="rounded-[30px] bg-[#F5F3EE] p-10 text-center flex flex-col items-center gap-4">
            <p className="display text-2xl font-bold m-0">New listings are being verified.</p>
            <p className="m-0 text-[var(--pg-text-secondary)]">Check back soon, or browse everything that&apos;s live right now.</p>
          </div>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))" }}>
            {shown.map((p) => {
              const low = p.bedsLeft > 0 && p.bedsLeft <= 2;
              return (
                <Link key={p.id} href={`/property/${p.id}`} className="lift no-underline text-[#10231F] bg-[#F5F3EE] rounded-[30px] p-2.5 flex flex-col">
                  <div className="relative h-[240px] rounded-[22px] overflow-hidden" style={{ background: "linear-gradient(160deg, #D59A6A 0%, #8C5A3C 100%)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photo} alt={`${p.name} — room photo`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute top-3.5 left-3.5 z-[2] text-xs font-bold px-[11px] py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.92)", color: "#10231F" }}>{p.who}</span>
                    <span className="absolute top-3.5 right-3.5 z-[2] text-xs font-bold px-[11px] py-1.5 rounded-full text-white" style={{ background: low ? "#B4461F" : "#10231F" }}>
                      {bedsLeftLabel(p.bedsLeft)}
                    </span>
                  </div>
                  <div className="px-3.5 pt-[18px] pb-3.5 flex flex-col gap-3.5">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <h3 className="display m-0 text-[22px] font-bold tracking-[-0.025em] truncate">{p.name}</h3>
                        <span className="text-sm truncate" style={{ color: "#5B6762" }}>{p.area}</span>
                      </div>
                      <div className="text-right flex flex-col gap-0.5 shrink-0">
                        <span className="display text-[22px] font-extrabold whitespace-nowrap">{rupees(p.price)}</span>
                        <span className="text-xs whitespace-nowrap" style={{ color: "#5B6762" }}>per bed / month</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
                      {p.near && <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-[7px]"><Walk />{p.near}</span>}
                      <span className="bg-white rounded-full px-3 py-[7px]">{p.sharing}</span>
                      <span className="bg-white rounded-full px-3 py-[7px]">{p.food}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex justify-center">
          <Link href="/propertys" className="inline-flex items-center gap-2.5 text-[#10231F] no-underline font-bold text-base border-[1.5px] border-[#10231F] rounded-full px-[26px] min-h-[52px]">
            View All Properties
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
