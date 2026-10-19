import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchResults from "./SearchClient";
import { apiGet } from "../../lib/serverApi";
import { SITE_URL } from "../../lib/site";
import { CITIES, cityPath } from "../../lib/cities";

// The interactive search is client-only (it reads the URL's filters), so this
// server page renders a crawlable version of the same listing as its fallback:
// a real H1, intro copy, links to every city page and every live PG.
export const revalidate = 600;

const GENDER_LABEL = { Boys: "Boys PG", Girls: "Girls PG", "Co-ed": "Co-ed PG" };
const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function CrawlableListing({ properties, total }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--pg-bg)", color: "var(--pg-text)" }}>
      <Navbar />
      <main id="main-content" className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 pt-10 pb-16 flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">Find a PG</span>
          <h1 className="display m-0 font-extrabold" style={{ fontSize: "clamp(34px, 4vw, 56px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
            {total > 0 ? `${total} PG${total === 1 ? "" : "s"}` : "PGs"} across <span style={{ color: "var(--pg-terracotta)" }}>Kerala</span>
          </h1>
          <p className="m-0 text-base text-[var(--pg-text-secondary)] max-w-[720px]">
            Search verified PGs, hostels and co-living spaces across Kerala on PGCON. Filter by budget, boys, girls or co-ed,
            room type and location, and see live bed availability before you visit.
          </p>
        </div>

        <section aria-labelledby="all-pgs">
          <h2 id="all-pgs" className="display m-0 mb-5 text-2xl font-bold">Verified PGs and hostels</h2>
          {properties.length > 0 ? (
            <ul className="list-none m-0 p-0 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))" }}>
              {properties.map((p) => (
                <li key={p.id}>
                  <Link href={`/property/${p.id}`} className="no-underline text-[var(--pg-ink)] bg-white rounded-[22px] px-5 py-4 flex justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block font-bold truncate">{p.name}</span>
                      <span className="block text-sm text-[var(--pg-text-tertiary)] truncate">
                        {[GENDER_LABEL[p.gender] || "PG", p.landmark, p.city].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {Number(p.starting_price) > 0 && <span className="font-extrabold whitespace-nowrap">{formatCurrency(p.starting_price)}/mo</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[var(--pg-text-secondary)]">
              We&apos;re verifying the first PGs right now. Every listing is checked by our team before it goes live.
              {" "}Own a PG? <Link href="/listProperty" className="font-bold">List it on PGCON</Link>.
            </p>
          )}
        </section>

        <section aria-labelledby="by-city">
          <h2 id="by-city" className="display m-0 mb-5 text-2xl font-bold">Browse PGs by city</h2>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-2.5">
            {CITIES.map((c) => (
              <li key={c.slug}>
                <Link href={cityPath(c)} className="inline-flex items-center min-h-11 px-4 rounded-full bg-white font-semibold no-underline text-[var(--pg-ink)] border border-[rgba(16,35,31,.12)]">
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

export default async function PropertysPage() {
  const data = await apiGet("/api/properties?limit=100&sort=rating", { revalidate: 600 });
  const properties = Array.isArray(data?.properties) ? data.properties : [];
  const total = Number(data?.total ?? properties.length);

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "PGs in Kerala", item: `${SITE_URL}/propertys` },
    ],
  };
  const listSchema = properties.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Verified PGs and hostels in Kerala",
        numberOfItems: properties.length,
        itemListElement: properties.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/property/${p.id}`, name: p.name })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema ? [schema, listSchema] : schema) }} />
      <SearchResults fallback={<CrawlableListing properties={properties} total={total} />} />
    </>
  );
}
