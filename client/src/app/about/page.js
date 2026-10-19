import Link from "next/link";
import { pageMetadata, SITE_URL, SITE_NAME } from "../../lib/site";
import { CITIES, cityPath } from "../../lib/cities";
import { CONTACT_EMAIL, COMPANY_NAME, SOCIAL_PROFILES } from "../../lib/contact";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";

export const metadata = pageMetadata({
  absoluteTitle: "About PGCON — Kerala's Verified PG Marketplace",
  description: `PGCON is Kerala's marketplace for verified PGs and hostels, run by ${COMPANY_NAME} in Kochi. Who we are, how we verify PGs and how we make money.`,
  path: "/about",
});

// The people behind PGCON. Add real team members only:
// { name: "…", role: "Founder", bio: "One or two sentences.", linkedin: "https://www.linkedin.com/in/…" }
const TEAM = [];

const FACTS = [
  { k: "What we are", v: "A marketplace for verified paying-guest (PG) accommodation, hostels and co-living spaces across Kerala, India." },
  { k: "Who runs it", v: `${COMPANY_NAME}, based in Kochi, Kerala.` },
  { k: "Where", v: `${CITIES.length} cities, including ${CITIES.slice(0, 4).map((c) => c.name).join(", ")} and more.` },
  { k: "How listings get in", v: "Every PG is reviewed by our team before it appears in search, and owners verify their identity (KYC)." },
  { k: "How we make money", v: "Owners pay ₹1,000 per PG per year to list (the first 250 PGs get 12 months free), and we keep 5% of rent paid through PGCON. Students pay the listed rent." },
];

export default function AboutPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE_URL}/about`,
    name: `About ${SITE_NAME}`,
    mainEntity: {
      "@id": `${SITE_URL}/#organization`,
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      parentOrganization: { "@type": "Organization", name: COMPANY_NAME },
      ...(TEAM.length ? { employee: TEAM.map((m) => ({ "@type": "Person", name: m.name, jobTitle: m.role, ...(m.linkedin ? { sameAs: [m.linkedin] } : {}) })) } : {}),
      ...(SOCIAL_PROFILES.length ? { sameAs: SOCIAL_PROFILES.map((p) => p.url) } : {}),
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageHero
          eyebrow="About PGCON"
          title="Kerala's marketplace for"
          accent="verified PGs."
          intro={`PGCON (pgcon.in) helps students and working professionals find a verified PG or hostel in Kerala, and helps PG owners fill their beds. It is run by ${COMPANY_NAME} from Kochi.`}
        />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-28 flex flex-col gap-6">
          <section aria-labelledby="facts" className="bg-white rounded-[30px] p-8">
            <h2 id="facts" className="display m-0 mb-5 text-2xl font-bold">PGCON at a glance</h2>
            <dl className="m-0 grid gap-4">
              {FACTS.map((f) => (
                <div key={f.k} className="grid gap-1 sm:grid-cols-[200px_minmax(0,1fr)]">
                  <dt className="font-bold">{f.k}</dt>
                  <dd className="m-0 text-[var(--pg-text-secondary)]">{f.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section aria-labelledby="why" className="bg-white rounded-[30px] p-8 flex flex-col gap-3">
              <h2 id="why" className="display m-0 text-2xl font-bold">Why we built it</h2>
              <p className="m-0 text-[var(--pg-text-secondary)] leading-relaxed">
                Most PGs in Kerala are still found through brokers, WhatsApp groups and word of mouth. Rent, rules and
                real availability are hard to compare, and students moving to a new city often book blind. PGCON puts
                verified listings, live bed availability and published prices in one place.
              </p>
            </section>
            <section aria-labelledby="verify" className="bg-white rounded-[30px] p-8 flex flex-col gap-3">
              <h2 id="verify" className="display m-0 text-2xl font-bold">How we verify a PG</h2>
              <p className="m-0 text-[var(--pg-text-secondary)] leading-relaxed">
                Owners submit their ID and property details, and our team reviews every listing before it goes live.
                Each bed is tracked, so a booked bed disappears from availability. Reviews can only come from students
                who booked through PGCON. <Link href="/how-it-works#verification" className="font-bold">More on verification</Link>.
              </p>
            </section>
          </div>

          {TEAM.length > 0 && (
            <section aria-labelledby="team" className="bg-white rounded-[30px] p-8">
              <h2 id="team" className="display m-0 mb-5 text-2xl font-bold">The team</h2>
              <ul className="list-none m-0 p-0 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
                {TEAM.map((m) => (
                  <li key={m.name} className="flex flex-col gap-1">
                    <span className="display text-xl font-bold">{m.name}</span>
                    <span className="mono text-[12px] tracking-[.12em] uppercase text-[var(--pg-text-tertiary)]">{m.role}</span>
                    {m.bio && <p className="m-0 text-[15px] text-[var(--pg-text-secondary)]">{m.bio}</p>}
                    {m.linkedin && <a href={m.linkedin} className="text-sm font-bold" rel="me noopener">LinkedIn</a>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="not-pgcon" className="rounded-[30px] p-8 flex flex-col gap-3" style={{ background: "var(--pg-forest)", color: "#F5F3EE" }}>
            <h2 id="not-pgcon" className="display m-0 text-2xl font-bold">Looking for the PostgreSQL conference?</h2>
            <p className="m-0 leading-relaxed" style={{ color: "rgba(245,243,238,.8)" }}>
              PGCON at pgcon.in is a PG and hostel marketplace in Kerala. We are not connected to PGCon, the PostgreSQL
              developer conference.
            </p>
          </section>

          <section aria-labelledby="find-us" className="bg-white rounded-[30px] p-8 flex flex-col gap-4">
            <h2 id="find-us" className="display m-0 text-2xl font-bold">Find us</h2>
            <p className="m-0 text-[var(--pg-text-secondary)]">
              Email <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold">{CONTACT_EMAIL}</a> or see all the ways to reach us on the <Link href="/contact" className="font-bold">contact page</Link>.
            </p>
            {SOCIAL_PROFILES.length > 0 && (
              <ul className="list-none m-0 p-0 flex flex-wrap gap-2.5">
                {SOCIAL_PROFILES.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} rel="me noopener" className="inline-flex items-center min-h-11 px-4 rounded-full bg-[var(--pg-bg)] font-semibold no-underline text-[var(--pg-ink)]">{s.name}</a>
                  </li>
                ))}
              </ul>
            )}
            <ul className="list-none m-0 p-0 flex flex-wrap gap-2.5">
              {CITIES.map((c) => (
                <li key={c.slug}>
                  <Link href={cityPath(c)} className="inline-flex items-center min-h-11 px-4 rounded-full bg-[var(--pg-bg)] font-semibold no-underline text-[var(--pg-ink)]">PG in {c.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
