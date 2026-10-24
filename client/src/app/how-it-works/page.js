import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";

const STUDENT_STEPS = [
  { title: "Search with intent", desc: "Filter by budget, gender, room type and city to find PGs that match what you actually need." },
  { title: "Inquire or save", desc: "Message an owner straight from a listing, or save it to your wishlist to compare later." },
  { title: "Move in with confidence", desc: "Every listing is verified by our team before it goes live, so you know what to expect." },
];
const OWNER_STEPS = [
  { title: "List your property", desc: "Add property details, rooms, amenities and photos — about ten minutes." },
  { title: "Get verified", desc: "Our team reviews new listings within 48 hours. Verify your ID (KYC) to earn the Verified Owner badge." },
  { title: "Manage beds & payouts", desc: "Track enquiries, keep your bed board current and collect rent from your Owner Dashboard." },
];

const H2 = ({ children }) => (
  <h2 className="display m-0 font-extrabold" style={{ fontSize: "clamp(34px, 4vw, 56px)", lineHeight: 1, letterSpacing: "-0.04em" }}>{children}</h2>
);

function Steps({ steps, dark }) {
  return (
    <ol className="list-none m-0 p-0 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
      {steps.map((s, i) => {
        const last = dark && i === steps.length - 1;
        return (
          <li key={s.title} className="lift rounded-[30px] p-8 flex flex-col gap-4 min-h-[240px]" style={last ? { background: "var(--pg-forest)", color: "#F5F3EE" } : { background: "#fff" }}>
            <span className="display text-[15px] font-bold" style={{ color: last ? "var(--pg-lamp)" : "var(--pg-terracotta)" }}>{String(i + 1).padStart(2, "0")}</span>
            <h3 className="display m-0 text-[28px] font-bold tracking-[-0.03em] mt-auto">{s.title}</h3>
            <p className="m-0 text-base" style={{ lineHeight: 1.55, color: last ? "rgba(245,243,238,.8)" : "var(--pg-text-secondary)" }}>{s.desc}</p>
          </li>
        );
      })}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageHero eyebrow="How it works" title="Three steps to your" accent="new university life." intro="A transparent marketplace for verified PG accommodation in Kerala — for students, parents and owners." />

        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-24 flex flex-col gap-10">
          <div className="flex flex-wrap justify-between items-end gap-6">
            <div className="flex flex-col gap-3"><span className="eyebrow">For students</span><H2>Find a bed, not just a building.</H2></div>
            <Link href="/propertys" className="inline-flex items-center min-h-12 px-6 rounded-full font-bold text-[15px] text-white no-underline" style={{ background: "var(--pg-ink)" }}>Find my bed</Link>
          </div>
          <Steps steps={STUDENT_STEPS} dark />
        </section>

        <section id="owners" className="scroll-mt-24 max-w-[1280px] mx-auto px-4 sm:px-6 pb-28 flex flex-col gap-10">
          <div className="flex flex-wrap justify-between items-end gap-6">
            <div className="flex flex-col gap-3"><span className="eyebrow">For owners</span><H2>Fill beds, not WhatsApp groups.</H2></div>
            <Link href="/listProperty" className="inline-flex items-center min-h-12 px-6 rounded-full font-bold text-[15px] text-white no-underline" style={{ background: "var(--pg-terracotta)" }}>List your PG</Link>
          </div>
          <Steps steps={OWNER_STEPS} />
        </section>

        <section id="verification" className="scroll-mt-24 bg-white py-28" style={{ borderRadius: "48px 48px 0 0" }}>
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 grid gap-14 lg:grid-cols-2 items-start">
            <div className="flex flex-col gap-5">
              <span className="eyebrow">Verification</span>
              <H2>Every listing is checked before it goes live.</H2>
              <p className="m-0 text-lg leading-relaxed text-[var(--pg-text-secondary)]">Students often choose a place to live without seeing it first. Admin review keeps the marketplace trustworthy.</p>
              <div className="kasavu w-[120px] mt-2" aria-hidden="true" />
            </div>
            <ol className="list-none m-0 p-0 flex flex-col gap-3">
              {[
                ["Submission received", "Your listing enters our review queue immediately."],
                ["Team review", "We check that details, pricing and photos are complete and consistent — usually within 48 hours."],
                ["Verified & published", "Approved listings get a Verified badge and appear to students searching your area."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4 items-start rounded-[22px] p-5" style={{ background: "var(--pg-bg)" }}>
                  <span className="w-9 h-9 rounded-full grid place-items-center text-sm font-extrabold shrink-0" style={{ background: "var(--pg-lamp)", color: "#2A1C00" }}>{i + 1}</span>
                  <span><span className="font-bold text-lg">{t}</span><span className="block text-[15px] text-[var(--pg-text-secondary)]">{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 bg-white pb-28">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col gap-10">
            <div className="flex flex-col gap-3 max-w-[760px]">
              <span className="eyebrow">Pricing & commission</span>
              <H2>Simple, published pricing.</H2>
              <p className="m-0 text-lg leading-relaxed text-[var(--pg-text-secondary)]">
                Listing costs ₹1,000 per property per year — the first 250 PGs to go live get their first year free. On rent collected through PGCON, a 5% platform fee applies:
              </p>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
              {[
                ["95%", "Paid to you as the owner", "var(--pg-forest)"],
                ["5%", "Platform fee to PGCON", "var(--pg-ink)"],
              ].map(([v, l, c]) => (
                <div key={v} className="rounded-[30px] p-7 flex flex-col gap-2" style={{ background: "var(--pg-bg)" }}>
                  <span className="display font-extrabold" style={{ fontSize: 56, lineHeight: 1, letterSpacing: "-0.05em", color: c }}>{v}</span>
                  <span className="text-[15px] text-[var(--pg-text-secondary)]">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
