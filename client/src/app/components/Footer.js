import Link from "next/link";
import Logo from "./Logo";
import { CITIES, cityPath } from "../../lib/cities";

const COLUMNS = [
  {
    title: "Students",
    links: [
      { label: "Find a bed", href: "/propertys" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Referral program", href: "/how-it-works#referral" },
    ],
  },
  {
    title: "Parents",
    links: [
      { label: "How we verify", href: "/how-it-works#verification" },
      { label: "Payments", href: "/help" },
      { label: "FAQ", href: "/help" },
    ],
  },
  {
    title: "Owners",
    links: [
      { label: "List your PG", href: "/listProperty" },
      { label: "Owner dashboard", href: "/ownersDashboard" },
      { label: "Pricing", href: "/how-it-works#pricing" },
    ],
  },
];

const LEGAL = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookie-policy" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: "var(--pg-footer-bg)" }}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 pb-12 flex flex-col gap-10">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex flex-col gap-3.5 max-w-[320px]">
            <Logo size={34} />
            <p className="m-0 text-[15px] leading-relaxed text-[var(--pg-text-secondary)]">
              Verified paying-guest beds near colleges across Kerala, with real availability and transparent rent.
            </p>
            <span className="ml text-base text-[var(--pg-terracotta)]" lang="ml">കേരളത്തിൽ നിന്ന്, സ്നേഹത്തോടെ</span>
          </div>
          <div className="grid gap-x-6 gap-y-8 flex-[1_1_320px] min-w-0 max-w-[640px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(130px, 100%), 1fr))" }}>
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2.5 text-[15px]">
                <span className="font-bold mb-1 text-[var(--pg-ink)]">{col.title}</span>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} className="text-[var(--pg-text-secondary)] no-underline hover:text-[var(--pg-terracotta)] transition-colors">
                    {l.label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>
        {/* Every page links to every city page, so search engines find and rank them. */}
        <nav aria-label="PGs by city" className="flex flex-col gap-3">
          <span className="font-bold text-[15px] text-[var(--pg-ink)]">PGs &amp; hostels by city</span>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
            {CITIES.map((c) => (
              <li key={c.slug}>
                <Link href={cityPath(c)} className="text-[var(--pg-text-secondary)] no-underline hover:text-[var(--pg-terracotta)] transition-colors">
                  PG in {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="kasavu opacity-60" aria-hidden="true" />
        <div className="flex flex-wrap justify-between gap-3 text-[13px] text-[var(--pg-text-tertiary)]">
          <span>© {year} PGCON · Kerala, India</span>
          <span className="flex flex-wrap gap-5">
            {LEGAL.map((l) => (
              <Link key={l.label} href={l.href} className="text-[var(--pg-text-tertiary)] hover:text-[var(--pg-terracotta)]">{l.label}</Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
