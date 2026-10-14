import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PageHero from "../../components/PageHero";
import { apiGet } from "../../../lib/serverApi";
import { pageMetadata, SITE_URL } from "../../../lib/site";
import { CITIES, cityBySlug, cityPath } from "../../../lib/cities";

// One landing page per city ("PG in Kochi", "hostel in Trivandrum"…), rendered
// on the server so search engines get the full content, and refreshed every
// 10 minutes so new listings show up without a rebuild.
export const revalidate = 600;
export const dynamicParams = false;
export const generateStaticParams = () => CITIES.map((c) => ({ city: c.slug }));

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80";
const GENDER_LABEL = { Boys: "Boys PG", Girls: "Girls PG", "Co-ed": "Co-ed PG" };
const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

async function getCityListings(city) {
  const data = await apiGet(`/api/properties?city=${encodeURIComponent(city.name)}&limit=24&sort=price_asc`, { revalidate: 600 });
  const properties = Array.isArray(data?.properties) ? data.properties : [];
  const prices = properties.map((p) => Number(p.starting_price)).filter((n) => n > 0);
  return {
    properties,
    total: Number(data?.total ?? properties.length),
    minPrice: prices.length ? Math.min(...prices) : null,
    freeBeds: properties.reduce((sum, p) => sum + Number(p.available_beds || 0), 0),
    girls: properties.filter((p) => p.gender === "Girls").length,
  };
}

const altNames = (city) => (city.alt.length ? ` (${city.alt.join(" / ")})` : "");

export async function generateMetadata({ params }) {
  const city = cityBySlug((await params).city);
  if (!city) return {};
  const { minPrice, total } = await getCityListings(city);
  const priceBit = minPrice ? ` from ${formatCurrency(minPrice)}/month` : "";
  const alsoKnown = city.alt[0] ? ` (${city.alt[0]})` : "";
  return pageMetadata({
    absoluteTitle: `PG in ${city.name}${alsoKnown} — Verified PGs & Hostels${priceBit} | PGCON`,
    description:
      `${total > 0 ? `${total} verified` : "Verified"} PGs and hostels in ${city.name}${altNames(city)} near ` +
      `${city.areas.slice(0, 3).join(", ")}. Boys, girls & co-ed rooms with live bed availability and transparent rent.`,
    path: cityPath(city),
  });
}

function buildFaq(city, stats) {
  const { total, minPrice, girls, freeBeds } = stats;
  return [
    {
      q: `How much does a PG in ${city.name} cost?`,
      a: minPrice
        ? `Verified PGs in ${city.name} on PGCON currently start from ${formatCurrency(minPrice)} per bed per month. Each listing shows the exact rent for single, double and shared rooms, so you can compare before you visit.`
        : `Rent is set by each owner and shown per bed per month on every listing, separately for single, double and shared rooms. Verified PGs in ${city.name} are being added — check back soon or browse nearby cities.`,
    },
    {
      q: `Are there girls' PGs in ${city.name}?`,
      a: girls > 0
        ? `Yes — ${girls} of the verified PGs listed in ${city.name} are for girls only, and co-ed options are available too. Use the Girls filter in search to see just those.`
        : `Every listing is marked Boys, Girls or Co-ed, so you can filter for girls-only PGs in ${city.name} in search as they're verified and added.`,
    },
    {
      q: `Which areas of ${city.name} are best for a PG?`,
      a: `Popular areas include ${city.areas.slice(0, 5).join(", ")}. Most people choose based on how close they are to ${city.near[0]}${city.near[1] ? ` or ${city.near[1]}` : ""}.`,
    },
    {
      q: `How do I know a PG in ${city.name} is genuine?`,
      a: `Every PG on PGCON is checked by our team before it goes live, and owners verify their identity. Bed availability is live${freeBeds > 0 ? ` — ${freeBeds} beds are free across ${city.name} right now` : ""}, so what you book is what's actually free.`,
    },
    {
      q: `Can I book a PG in ${city.name} online?`,
      a: `Yes. Pick a room, request a bed and the owner confirms it. You then pay the first month's rent securely through PGCON with UPI, card or net banking${total > 0 ? "" : " once listings in your area go live"}.`,
    },
  ];
}

export default async function CityPage({ params }) {
  const city = cityBySlug((await params).city);
  if (!city) notFound();

  const stats = await getCityListings(city);
  const { properties, total, minPrice, freeBeds } = stats;
  const faq = buildFaq(city, stats);
  const url = `${SITE_URL}${cityPath(city)}`;
  const others = CITIES.filter((c) => c.slug !== city.slug);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: `PGs in ${city.name}`, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    ...(properties.length
      ? [{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `PGs and hostels in ${city.name}`,
          numberOfItems: properties.length,
          itemListElement: properties.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/property/${p.id}`, name: p.name })),
        }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Navbar />

      <main id="main-content">
        <nav aria-label="Breadcrumb" className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8">
          <ol className="mono flex flex-wrap items-center gap-2 text-[12px] tracking-[.08em] uppercase text-[var(--pg-text-tertiary)] list-none m-0 p-0">
            <li><Link href="/" className="text-[var(--pg-text-tertiary)] no-underline hover:text-[var(--pg-terracotta)]">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--pg-ink)]">PGs in {city.name}</li>
          </ol>
        </nav>

        <PageHero
          eyebrow={`${city.district} · Kerala`}
          title="PGs & hostels in"
          accent={`${city.name}.`}
          intro={`${city.blurb}${city.alt.length ? ` Also searched as ${city.alt.join(" or ")}.` : ""}`}
        >
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full bg-white px-3.5 py-2">{total > 0 ? `${total} verified PG${total === 1 ? "" : "s"}` : "Verified PGs coming soon"}</span>
            {minPrice && <span className="rounded-full bg-white px-3.5 py-2">From {formatCurrency(minPrice)}/month</span>}
            {freeBeds > 0 && <span className="rounded-full px-3.5 py-2 text-white" style={{ background: "var(--pg-ink)" }}>{freeBeds} beds free now</span>}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/propertys?location=${encodeURIComponent(city.name)}`} className="btn-shine inline-flex items-center min-h-12 px-6 rounded-full font-bold text-white no-underline" style={{ background: "var(--pg-terracotta)" }}>
              Search & filter PGs in {city.name}
            </Link>
            <Link href="/listProperty" className="inline-flex items-center min-h-12 px-6 rounded-full font-bold no-underline text-[var(--pg-ink)] border-[1.5px] border-[var(--pg-ink)]">
              List your PG in {city.name}
            </Link>
          </div>
        </PageHero>

        <section aria-labelledby="listings-heading" className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-16">
          <h2 id="listings-heading" className="display m-0 mb-6 font-extrabold text-[clamp(28px,3vw,40px)] tracking-[-0.03em]">
            {total > 0 ? `Verified PGs in ${city.name}` : `PGs in ${city.name}`}
          </h2>
          {properties.length > 0 ? (
            <ul className="list-none m-0 p-0 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))" }}>
              {properties.map((p) => (
                <li key={p.id}>
                  <Link href={`/property/${p.id}`} className="lift no-underline text-[var(--pg-ink)] bg-white rounded-[30px] p-2.5 flex flex-col h-full">
                    <div className="relative h-[200px] rounded-[22px] overflow-hidden" style={{ background: "linear-gradient(160deg, #D59A6A 0%, #8C5A3C 100%)" }}>
                      <img src={p.property_images?.[0]?.image_url || FALLBACK_IMAGE} alt={`${p.name}, ${GENDER_LABEL[p.gender] || "PG"} in ${p.landmark || city.name}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      <span className="absolute top-3.5 left-3.5 text-xs font-bold px-[11px] py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.92)" }}>{GENDER_LABEL[p.gender] || "PG"}</span>
                      {Number(p.available_beds) > 0 && (
                        <span className="absolute bottom-3.5 left-3.5 text-xs font-bold px-[11px] py-1.5 rounded-full text-white" style={{ background: "var(--pg-ink)" }}>{p.available_beds} beds left</span>
                      )}
                    </div>
                    <div className="px-3.5 pt-4 pb-3 flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="display m-0 text-xl font-bold truncate">{p.name}</h3>
                        <span className="block text-sm truncate text-[var(--pg-text-tertiary)]">{[p.landmark, p.address].filter(Boolean)[0] || city.name}</span>
                      </div>
                      <span className="display text-xl font-extrabold whitespace-nowrap">{formatCurrency(p.starting_price)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white rounded-[30px] p-8 flex flex-col gap-3 max-w-[760px]">
              <p className="m-0 text-lg font-semibold">We&apos;re verifying PGs in {city.name} right now.</p>
              <p className="m-0 text-[var(--pg-text-secondary)]">
                Every listing is checked before it goes live. Own a PG here? <Link href="/listProperty" className="font-bold">List it free</Link> — the first 250 PGs on PGCON pay no listing fee.
                {" "}Looking for a bed? <Link href="/propertys" className="font-bold">Browse all verified PGs in Kerala</Link>.
              </p>
            </div>
          )}
          {total > properties.length && (
            <p className="mt-6 mb-0">
              <Link href={`/propertys?location=${encodeURIComponent(city.name)}`} className="font-bold text-[var(--pg-ink)]">See all {total} PGs in {city.name} →</Link>
            </p>
          )}
        </section>

        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-16 grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-[30px] p-7">
            <h2 className="display m-0 mb-4 text-2xl font-bold">Popular areas for PGs in {city.name}</h2>
            <ul className="list-none m-0 p-0 flex flex-wrap gap-2">
              {city.areas.map((a) => <li key={a} className="rounded-full bg-[var(--pg-bg)] px-3.5 py-2 text-sm font-semibold">{a}</li>)}
            </ul>
          </div>
          <div className="bg-white rounded-[30px] p-7">
            <h2 className="display m-0 mb-4 text-2xl font-bold">PGs near colleges & workplaces</h2>
            <ul className="m-0 pl-5 flex flex-col gap-1.5 text-[var(--pg-text-secondary)]">
              {city.near.map((n) => <li key={n}>PG near {n}</li>)}
            </ul>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-16">
          <h2 id="faq-heading" className="display m-0 mb-6 font-extrabold text-[clamp(28px,3vw,40px)] tracking-[-0.03em]">PG in {city.name}: common questions</h2>
          <div className="flex flex-col gap-3 max-w-[860px]">
            {faq.map((f) => (
              <details key={f.q} className="bg-white rounded-[22px] px-6 py-5 group">
                <summary className="cursor-pointer font-bold text-lg list-none flex justify-between gap-4">
                  {f.q}<span aria-hidden="true" className="text-[var(--pg-terracotta)] group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="m-0 mt-3 text-[var(--pg-text-secondary)] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="other-cities" className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-24">
          <h2 id="other-cities" className="display m-0 mb-5 text-2xl font-bold">PGs in other cities in Kerala</h2>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-2.5">
            {others.map((c) => (
              <li key={c.slug}>
                <Link href={cityPath(c)} className="inline-flex items-center min-h-11 px-4 rounded-full bg-white font-semibold no-underline text-[var(--pg-ink)] border border-[rgba(16,35,31,.12)] hover:border-[var(--pg-ink)]">
                  PG in {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
