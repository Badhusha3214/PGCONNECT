import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";

const PLACES = [
  { title: "Students", text: "Bookings, rent payments and your referral earnings.", href: "/referrerDashboard", cta: "Student dashboard", bg: "#0F3B33", fg: "#F5F3EE", btn: "#FFC447", btnFg: "#2A1C00" },
  { title: "PG owners", text: "Listings, bed availability, enquiries, KYC and payouts.", href: "/ownersDashboard", cta: "Owner dashboard", bg: "#B4461F", fg: "#FFFFFF", btn: "#FFFFFF", btnFg: "#8E3415" },
  { title: "Agents", text: "Properties you've onboarded and your commissions.", href: "/agentDashboard", cta: "Agent dashboard", bg: "#FFFFFF", fg: "#10231F", btn: "#10231F", btnFg: "#FFFFFF" },
];

export default function Profile() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageHero eyebrow="Your account" title="Everything you manage," accent="in one place." intro="Pick your dashboard. Account details and password live in each dashboard's Settings." />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-28 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))" }}>
          {PLACES.map((p) => (
            <div key={p.title} className="lift rounded-[30px] p-8 flex flex-col gap-4 min-h-[260px]" style={{ background: p.bg, color: p.fg }}>
              <h2 className="display m-0 text-[30px] font-extrabold tracking-[-0.03em]">{p.title}</h2>
              <p className="m-0 text-base" style={{ lineHeight: 1.55, opacity: 0.85 }}>{p.text}</p>
              <Link href={p.href} className="mt-auto self-start inline-flex items-center min-h-12 px-6 rounded-full font-bold text-[15px] no-underline" style={{ background: p.btn, color: p.btnFg }}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
