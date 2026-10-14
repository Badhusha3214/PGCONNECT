import Link from "next/link";
import { pageMetadata } from "../../lib/site";
import { CONTACT_EMAIL, CONTACT_PHONES, CONTACT_HOURS } from "../../lib/contact";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";

export const metadata = pageMetadata({
  title: "Contact Us",
  description: "Get in touch with the PGCON team for help with bookings, listings, payments or partnerships.",
  path: "/contact",
});

const icon = (d) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const CHANNELS = [
  { label: "Email", value: CONTACT_EMAIL, note: "Replies within a working day", href: `mailto:${CONTACT_EMAIL}`, bg: "#FCEDE6", fg: "#B4461F", icon: icon(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></>) },
  ...CONTACT_PHONES.map((p, i) => ({
    label: i === 0 ? "Call us" : "Call us (alternate)",
    value: p.display,
    note: CONTACT_HOURS,
    href: `tel:${p.tel}`,
    bg: "#E9F5EE",
    fg: "#1F6B4A",
    icon: icon(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />),
  })),
  { label: "Office", value: "Kochi, Kerala, India", note: "Visits by appointment", href: null, bg: "#FFF4D6", fg: "#9A6A00", icon: icon(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>) },
];

const TOPICS = [
  { who: "Students & parents", text: "Questions about a listing, a booking or a payment." },
  { who: "PG owners", text: "Listing your property, verification, KYC or payouts." },
  { who: "Partnerships", text: "Colleges, agents and anyone helping students find a home." },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageHero eyebrow="Contact" title="Talk to a real person" accent="in Kerala." intro="Have a question about a listing, a booking or your account? Reach us any way you like — we read every message." />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-28 flex flex-col gap-6">
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
            {CHANNELS.map((c) => {
              const body = (
                <>
                  <span className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: c.bg, color: c.fg }}>{c.icon}</span>
                  <span className="mono text-[12px] tracking-[.12em] uppercase text-[var(--pg-text-tertiary)]">{c.label}</span>
                  <span className="display text-2xl font-bold tracking-[-0.02em] break-words">{c.value}</span>
                  <span className="text-sm text-[var(--pg-text-secondary)]">{c.note}</span>
                </>
              );
              const cls = "lift bg-white rounded-[30px] p-7 flex flex-col gap-3 no-underline text-[var(--pg-ink)]";
              return c.href ? <a key={c.label} href={c.href} className={cls}>{body}</a> : <div key={c.label} className={cls}>{body}</div>;
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="bg-white rounded-[30px] p-8 flex flex-col gap-5">
              <span className="eyebrow">What we can help with</span>
              <ul className="list-none m-0 p-0 flex flex-col gap-4">
                {TOPICS.map((t) => (
                  <li key={t.who} className="flex gap-3.5 items-start">
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F6B4A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    <span><span className="font-bold">{t.who}</span><span className="block text-[15px] text-[var(--pg-text-secondary)]">{t.text}</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[30px] p-8 flex flex-col justify-between gap-6" style={{ background: "var(--pg-forest)", color: "#F5F3EE" }}>
              <div className="flex flex-col gap-3">
                <span className="mono text-[13px] tracking-[.14em]" style={{ color: "var(--pg-lamp)" }}>PREFER TO BROWSE FIRST?</span>
                <span className="display text-3xl font-extrabold tracking-[-0.03em] leading-tight">Most answers are already in the Help Center.</span>
              </div>
              <Link href="/help" className="self-start inline-flex items-center min-h-12 px-6 rounded-full font-bold text-[15px] no-underline" style={{ background: "var(--pg-lamp)", color: "#2A1C00" }}>Visit Help Center</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
