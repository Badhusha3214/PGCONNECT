"use client";
import { useState } from "react";
import Link from "next/link";

// The four "only on PGCON" features, reproduced exactly from the design
// (interactive demos on the design's sample data).

const pill = (on, dark) =>
  "border-0 rounded-full px-4 min-h-10 text-sm font-bold cursor-pointer " +
  (on ? (dark ? "bg-[var(--pg-lamp)] text-[#2A1C00]" : "bg-[var(--pg-ink)] text-white") : dark ? "bg-transparent text-[rgba(245,243,238,.85)]" : "bg-transparent text-[var(--pg-text-secondary)]");

const Row = ({ children }) => (
  <div className="reveal grid gap-16 items-center pt-10 pb-28" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(460px, 100%), 1fr))" }}>
    {children}
  </div>
);

const Copy = ({ tag, title, children }) => (
  <div className="flex flex-col gap-5 max-w-[480px]">
    <span className="mono text-[13px] tracking-[.1em] text-[var(--pg-text-tertiary)]">{tag}</span>
    <h3 className="display m-0 font-extrabold" style={{ fontSize: "clamp(32px, 3.4vw, 48px)", lineHeight: 1.02, letterSpacing: "-0.04em" }}>{title}</h3>
    <p className="m-0 text-lg leading-relaxed text-[var(--pg-text-secondary)]">{children}</p>
  </div>
);

/* ── A. Floor-plan bed picker ─────────────────────────────────────────────── */
const BEDS = [
  { id: "1A", x: 4, y: 8, free: false, room: "ROOM 1 · TRIPLE" },
  { id: "1B", x: 18, y: 8, free: false, room: "ROOM 1 · TRIPLE" },
  { id: "1C", x: 32, y: 8, free: true, room: "ROOM 1 · TRIPLE", price: "₹5,400", note: "Corner bed, own shelf, next to the window" },
  { id: "2A", x: 54, y: 8, free: false, room: "ROOM 2 · DOUBLE" },
  { id: "2B", x: 86, y: 8, free: true, room: "ROOM 2 · DOUBLE", price: "₹6,500", note: "Window side, shares a study desk with one" },
  { id: "3A", x: 4, y: 68, free: true, room: "ROOM 3 · SINGLE", price: "₹8,200", note: "Private room with its own wardrobe" },
];

function BedPicker() {
  const [bed, setBed] = useState("2B");
  const sel = BEDS.find((b) => b.id === bed) || BEDS[4];
  const wall = "absolute border-[3px] border-[var(--pg-ink)]";
  const label = "mono absolute text-[10px] tracking-[.1em] text-[var(--pg-text-tertiary)]";
  return (
    <Row>
      <div className="flex flex-col gap-5 max-w-[480px]">
        <span className="mono text-[13px] tracking-[.1em] text-[var(--pg-text-tertiary)]">01 · FLOOR-PLAN BED PICKER</span>
        <h3 className="display m-0 font-extrabold" style={{ fontSize: "clamp(32px, 3.4vw, 48px)", lineHeight: 1.02, letterSpacing: "-0.04em" }}>Choose the bed, not just the building.</h3>
        <p className="m-0 text-lg leading-relaxed text-[var(--pg-text-secondary)]">Every PG is drawn to scale. Glowing beds are free right now. Tap one to see its price, what&apos;s next to it and which way the window faces.</p>
        <div className="flex flex-wrap gap-[18px] text-sm font-semibold text-[var(--pg-text-secondary)]">
          <span className="inline-flex items-center gap-2"><span className="w-3.5 h-5 rounded" style={{ background: "#FFF1CC", border: "2px solid #D99A1E" }} />Free</span>
          <span className="inline-flex items-center gap-2"><span className="w-3.5 h-5 rounded" style={{ background: "#E7E3D8", border: "1.5px dashed #A9A396" }} />Taken</span>
          <span className="inline-flex items-center gap-2"><span className="w-3.5 h-5 rounded" style={{ background: "var(--pg-terracotta)" }} />Your pick</span>
        </div>
      </div>
      <div className="relative rounded-[36px] p-7 flex flex-col gap-5 bg-[var(--pg-bg)]">
        <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "13 / 10", background: "#FBFAF6" }}>
          <div className={wall} style={{ left: 0, top: 0, width: "48%", height: "52%", borderRadius: "16px 0 0 0" }} />
          <div className={wall} style={{ left: "48%", top: 0, width: "52%", height: "52%", borderLeft: 0, borderRadius: "0 16px 0 0" }} />
          <div className={wall} style={{ left: 0, top: "62%", width: "30%", height: "38%", borderRadius: "0 0 0 16px" }} />
          <div className={wall} style={{ left: "30%", top: "62%", width: "20%", height: "38%", borderLeft: 0, background: "repeating-linear-gradient(45deg, transparent 0 8px, rgba(16,35,31,.05) 8px 9px)" }} />
          <div className={wall} style={{ left: "50%", top: "62%", width: "50%", height: "38%", borderLeft: 0, borderRadius: "0 0 16px 0" }} />
          <div className="absolute rounded" style={{ left: "68%", top: "8%", width: "12%", height: "11%", border: "1.5px solid #A9A396" }} />
          <div className="absolute rounded-[10px]" style={{ left: "62%", top: "72%", width: "26%", height: "18%", border: "1.5px solid #A9A396" }} />
          <span className={label} style={{ left: "3%", top: "44%" }}>ROOM 1</span>
          <span className={label} style={{ left: "51%", top: "44%" }}>ROOM 2</span>
          <span className={label} style={{ left: "16%", top: "90%" }}>ROOM 3</span>
          <span className={label} style={{ left: "33%", top: "90%" }}>BATH</span>
          <span className={label} style={{ left: "53%", top: "90%" }}>DINING</span>
          <span className={label} style={{ left: "40%", top: "55.5%", color: "#A9A396" }}>CORRIDOR</span>
          {BEDS.map((b) => {
            const on = bed === b.id;
            const look = !b.free
              ? { background: "#E7E3D8", border: "1.5px dashed #A9A396", color: "#5B6762", cursor: "not-allowed" }
              : on
                ? { background: "var(--pg-terracotta)", border: "2px solid var(--pg-terracotta)", color: "#fff", boxShadow: "0 12px 26px -8px rgba(180,70,31,.6)", cursor: "pointer" }
                : { background: "#FFF1CC", border: "2px solid #D99A1E", color: "var(--pg-ink)", cursor: "pointer" };
            return (
              <button
                key={b.id}
                type="button"
                disabled={!b.free}
                aria-pressed={on}
                aria-label={`Bed ${b.id}${b.free ? `, free, ${b.price} per month` : ", taken"}`}
                onClick={() => b.free && setBed(b.id)}
                className={`mono absolute rounded-[10px] flex items-end justify-center pb-2 text-xs font-bold transition-[background,transform] ${b.free && !on ? "bed-free" : ""}`}
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: "10%", height: "28%", ...look }}
              >
                <span aria-hidden="true" className="absolute rounded-md" style={{ top: "7%", left: "14%", width: "72%", height: "15%", background: "rgba(255,255,255,.65)" }} />
                <span>{b.id}</span>
              </button>
            );
          })}
        </div>
        <div className="bg-white rounded-[22px] px-5 py-[18px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="mono text-xs tracking-[.06em] text-[var(--pg-terracotta)]">BED {sel.id} · {sel.room}</span>
            <span className="text-base font-semibold">{sel.note}</span>
          </div>
          <div className="flex items-center gap-4">
            <span><span className="display text-2xl font-extrabold">{sel.price}</span><span className="text-[13px] text-[var(--pg-text-tertiary)]"> /mo</span></span>
            <Link href="/propertys" className="text-white no-underline font-bold text-[15px] px-5 min-h-[46px] inline-flex items-center rounded-full" style={{ background: "var(--pg-terracotta)" }}>Hold bed {sel.id}</Link>
          </div>
        </div>
      </div>
    </Row>
  );
}

/* ── B. Commute rings ─────────────────────────────────────────────────────── */
const PINS = [
  { x: 306, y: 150, t: "₹6.5k", lit: true, o: 1 },
  { x: 178, y: 250, t: "₹6.0k", lit: true, o: 1 },
  { x: 390, y: 232, t: "₹5.4k", lit: false, o: 0.92 },
  { x: 96, y: 120, t: "₹5.8k", lit: false, o: 0.92 },
  { x: 430, y: 96, t: "₹4.9k", lit: false, o: 0.55 },
];

function CommuteRings() {
  const [mode, setMode] = useState("walk");
  const unit = mode === "walk" ? " MIN WALK" : " MIN BUS";
  return (
    <Row>
      <div className="relative rounded-[36px] p-6 overflow-hidden" style={{ background: "var(--pg-forest)" }}>
        <svg role="img" aria-label="Map with 5, 10 and 15 minute commute rings around CMS College and PGs plotted inside them" viewBox="0 0 560 460" className="block w-full h-auto">
          <defs><pattern id="mgrid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,.04)" /></pattern></defs>
          <rect width="560" height="460" fill="url(#mgrid)" />
          <path d="M-10 360 C 90 300, 150 420, 260 380 S 430 250, 570 300" fill="none" stroke="#2F7E86" strokeWidth="22" strokeLinecap="round" opacity=".55" />
          <text x="440" y="318" fontFamily="var(--font-figtree), sans-serif" fontSize="12" fill="#8FD3C7" fontStyle="italic">Meenachil river</text>
          <g stroke="rgba(237,231,214,.16)" strokeWidth="5" fill="none" strokeLinecap="round"><path d="M0 120 L560 190" /><path d="M180 0 L320 460" /><path d="M400 0 C 380 120, 420 220, 520 460" /></g>
          <circle cx="280" cy="210" r="200" fill="rgba(255,196,71,.04)" stroke="rgba(255,196,71,.35)" strokeDasharray="4 6" strokeWidth="1.5" />
          <circle cx="280" cy="210" r="135" fill="rgba(255,196,71,.06)" stroke="rgba(255,196,71,.5)" strokeDasharray="4 6" strokeWidth="1.5" />
          <circle cx="280" cy="210" r="70" fill="rgba(255,196,71,.1)" stroke="rgba(255,196,71,.75)" strokeWidth="1.5" />
          <circle className="ripple-svg" cx="280" cy="210" r="70" fill="none" stroke="#FFC447" strokeWidth="2" />
          <circle className="ripple-svg r2" cx="280" cy="210" r="70" fill="none" stroke="#FFC447" strokeWidth="2" />
          <circle className="ripple-svg r3" cx="280" cy="210" r="70" fill="none" stroke="#FFC447" strokeWidth="2" />
          <g fontFamily="var(--font-jetbrains), monospace" fontSize="11" fill="#FFD27A" textAnchor="middle" letterSpacing="1">
            <text x="280" y="134">{`5${unit}`}</text><text x="280" y="70">{`10${unit}`}</text><text x="280" y="5" dy="12">{`15${unit}`}</text>
          </g>
          <circle cx="280" cy="210" r="14" fill="#E2683C" stroke="#FFFFFF" strokeWidth="3" />
          <text x="280" y="246" textAnchor="middle" fontFamily="var(--font-figtree), sans-serif" fontSize="13" fontWeight="700" fill="#FFFFFF">CMS College</text>
          <g fontFamily="var(--font-figtree), sans-serif" fontSize="12" fontWeight="700">
            {PINS.map((p) => (
              <g key={p.t}>
                <rect x={p.x} y={p.y} width="70" height="28" rx="14" fill={p.lit ? "#FFD27A" : "#FFFFFF"} opacity={p.o} />
                <text x={p.x + 35} y={p.y + 19} textAnchor="middle" fill={p.lit ? "#3A2600" : "#10231F"}>{p.t}</text>
              </g>
            ))}
          </g>
        </svg>
        <div role="group" aria-label="Commute mode" className="absolute top-5 left-5 flex gap-1 rounded-full p-1" style={{ background: "rgba(0,0,0,.25)" }}>
          {[["walk", "Walk"], ["bus", "Bus"]].map(([id, l]) => (
            <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={pill(mode === id, true)}>{l}</button>
          ))}
        </div>
      </div>
      <Copy tag="02 · SEARCH BY COMMUTE" title="Measured in minutes, not kilometres.">
        “Near college” means nothing in Kerala&apos;s monsoon. We plot every PG inside 5, 10 and 15-minute rings from your college gate, on foot or by bus, so you know exactly how wet your mornings will be.
      </Copy>
    </Row>
  );
}

/* ── C. Bedmate vibe tags ─────────────────────────────────────────────────── */
const MATE = ["Early riser", "Quiet studier", "Vegetarian", "Lights out by 11"];
const ALL_TAGS = ["Early riser", "Night owl", "Quiet studier", "Gym before class", "Vegetarian", "Lights out by 11", "Music on speakers", "Malayalam + English"];

function VibeTags() {
  const [mine, setMine] = useState(["Early riser", "Quiet studier"]);
  const matches = MATE.filter((t) => mine.includes(t)).length;
  return (
    <Row>
      <Copy tag="03 · BEDMATE VIBE TAGS" title="Know the vibe before you share the room.">
        Residents add a few anonymous tags about how they live. No names, no photos, no profiles. Just enough to tell an early riser from a 2 AM gamer.
      </Copy>
      <div className="relative rounded-[36px] p-7 flex flex-col gap-[18px] bg-[var(--pg-bg)]">
        <div className="bg-white rounded-3xl p-[22px] flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="w-11 h-11 rounded-[14px] grid place-items-center" style={{ background: "var(--pg-forest)" }}>
                <span className="w-[18px] h-[18px] rounded-full" style={{ background: "var(--pg-mint)" }} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-base">Your bedmate in Room 2</span>
                <span className="text-[13px] text-[var(--pg-text-tertiary)]">Anonymous · 2nd-year student</span>
              </div>
            </div>
            <span className="display text-[15px] font-extrabold px-3 py-[7px] rounded-full whitespace-nowrap" style={{ color: "var(--pg-success)", background: "var(--pg-success-bg)" }}>
              {matches} of {MATE.length} vibes match
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MATE.map((t) => (
              <span key={t} className="text-sm font-semibold px-3.5 py-2 rounded-full" style={mine.includes(t) ? { background: "var(--pg-forest)", color: "#fff" } : { background: "var(--pg-surface-muted)", color: "var(--pg-text-secondary)" }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 px-1.5 py-1">
          <span className="text-sm font-bold text-[var(--pg-text-secondary)]">Tap the tags that sound like you</span>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((t) => {
              const on = mine.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMine(on ? mine.filter((x) => x !== t) : [...mine, t])}
                  className="rounded-full px-3.5 min-h-10 text-sm font-semibold cursor-pointer"
                  style={on ? { background: "var(--pg-terracotta)", color: "#fff", border: "1.5px solid var(--pg-terracotta)" } : { background: "#fff", color: "var(--pg-ink)", border: "1.5px solid rgba(16,35,31,.15)" }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Row>
  );
}

/* ── D. Day in the life ───────────────────────────────────────────────────── */
const fmt = (x) => {
  const hr = Math.floor(x);
  const m = x % 1 ? "30" : "00";
  const ap = hr >= 12 ? "PM" : "AM";
  return `${((hr + 11) % 12) + 1}:${m} ${ap}`;
};

function dayAt(h) {
  let food;
  if (h < 7) food = ["Tea at 7:00", "Breakfast from 7:30: puttu and kadala curry"];
  else if (h < 9.5) food = ["Puttu & kadala curry", "Breakfast till 9:30, with tea or coffee"];
  else if (h < 12.5) food = ["Lunch at 12:30", "Kerala meals: matta rice, sambar, thoran, moru"];
  else if (h < 14.5) food = ["Kerala meals", "Matta rice, sambar, thoran, moru. Fish fry on Wednesdays"];
  else if (h < 17) food = ["Evening chai at 5:00", "Tea with pazhampori or banana chips"];
  else if (h < 18.5) food = ["Chai & pazhampori", "Served in the dining room till 6:30"];
  else if (h < 20) food = ["Dinner at 8:00", "Chapathi with egg curry or veg kurma"];
  else if (h < 21.5) food = ["Chapathi & egg curry", "Veg kurma option. Kitchen closes at 9:30"];
  else food = ["Kitchen closed", "Kettle and drinking water stay on all night"];
  const gateOpen = h >= 6 && h < 21.5;
  const laundryFree = (h >= 7 && h < 10) || (h >= 16 && h < 19);
  const wifi = h >= 19 && h < 23
    ? ["Busy · evening peak", "Everyone's streaming. Video calls may stutter", "#FFC447"]
    : h >= 9 && h < 16
      ? ["Quiet · fast", "Most residents are in class", "#4FD1A1"]
      : ["Steady", "Good enough for lectures and calls", "#4FD1A1"];
  return [
    { kind: "FOOD", title: food[0], detail: food[1], c: "#FFC447" },
    { kind: "GATE", title: gateOpen ? "Open · closes 9:30 PM" : "Closed · opens 6:00 AM", detail: gateOpen ? "Warden at the desk till closing" : "Late entry needs a call to the warden", c: gateOpen ? "#4FD1A1" : "#FF8A5C" },
    { kind: "LAUNDRY", title: laundryFree ? "Machine free now" : h < 16 ? "Next slot 4:00 PM" : "Next slot 7:00 AM", detail: "Two washing machines, terrace drying line", c: laundryFree ? "#4FD1A1" : "#9AA8A3" },
    { kind: "WI-FI", title: wifi[0], detail: wifi[1], c: wifi[2] },
  ];
}

function DayInTheLife() {
  const [hour, setHour] = useState(7.5);
  return (
    <div className="reveal relative rounded-[40px] flex flex-col gap-9 mb-20" style={{ background: "var(--pg-ink)", color: "#F5F3EE", padding: "clamp(28px, 4vw, 56px)" }}>
      <div className="grid gap-8 items-end" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))" }}>
        <div className="flex flex-col gap-[18px]">
          <span className="mono text-[13px] tracking-[.1em]" style={{ color: "var(--pg-lamp)" }}>04 · DAY-IN-THE-LIFE SLIDER</span>
          <h3 className="display m-0 font-extrabold" style={{ fontSize: "clamp(32px, 3.4vw, 48px)", lineHeight: 1.02, letterSpacing: "-0.04em" }}>Live a day there before you move in.</h3>
        </div>
        <p className="m-0 text-lg leading-relaxed" style={{ color: "rgba(245,243,238,.78)" }}>Drag through a real day at Meenachil House: what&apos;s cooking, when the gate shuts, when the washing machine is free and how the Wi-Fi holds up after dinner.</p>
      </div>
      <div className="flex flex-col gap-3.5">
        <div className="flex justify-between items-baseline gap-3">
          <label htmlFor="dayslider" className="text-sm font-semibold" style={{ color: "rgba(245,243,238,.7)" }}>Time of day</label>
          <span className="display font-extrabold" style={{ fontSize: "clamp(40px, 5vw, 64px)", letterSpacing: "-0.04em", color: "var(--pg-lamp)" }}>{fmt(hour)}</span>
        </div>
        <input id="dayslider" type="range" min="6" max="23" step="0.5" value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full h-8 cursor-pointer" />
        <div className="mono flex justify-between text-[11px] tracking-[.06em]" aria-hidden="true" style={{ color: "rgba(245,243,238,.5)" }}>
          <span>6 AM</span><span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span><span>9 PM</span><span>11 PM</span>
        </div>
      </div>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
        {dayAt(hour).map((d) => (
          <div key={d.kind} className="rounded-3xl p-[22px] flex flex-col gap-2.5 min-h-[168px]" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" }}>
            <div className="flex justify-between items-center gap-2.5">
              <span className="mono text-xs tracking-[.1em]" style={{ color: "rgba(245,243,238,.6)" }}>{d.kind}</span>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.c, boxShadow: `0 0 0 4px ${d.c}33` }} />
            </div>
            <span className="display text-[22px] font-bold tracking-[-0.02em] leading-tight">{d.title}</span>
            <span className="text-sm leading-normal" style={{ color: "rgba(245,243,238,.72)" }}>{d.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="bg-white pt-28 pb-10" style={{ borderRadius: "48px 48px 0 0" }}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="reveal flex flex-col gap-[18px] max-w-[820px] mb-20">
          <span className="eyebrow">Only on PGCON</span>
          <h2 className="display m-0 font-extrabold" style={{ fontSize: "clamp(40px, 5.2vw, 76px)", lineHeight: 0.98, letterSpacing: "-0.045em", textWrap: "balance" }}>
            Four things no PG listing has ever told you.
          </h2>
        </div>
        <BedPicker />
        <CommuteRings />
        <VibeTags />
        <DayInTheLife />
      </div>
    </section>
  );
}
