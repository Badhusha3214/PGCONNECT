import HomeClient from "./HomeClient";
import { pageMetadata, SITE_URL, SITE_NAME } from "../lib/site";
import { apiGet } from "../lib/serverApi";
import { INTRO_SEEN_SCRIPT } from "./home/IntroLoader";

export const metadata = pageMetadata({
  absoluteTitle: "Verified PGs & Hostels in Kerala | PGCON",
  description: "Verified PGs, hostels and co-living in Kochi, Thiruvananthapuram, Kozhikode, Thrissur and across Kerala. Compare rent, amenities and live bed availability.",
  path: "/",
});

const siteSchema = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512x512.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/propertys?location={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

export default async function Home() {
  // Fetched on the server so listing links, real stats and real reviews are in
  // the HTML crawlers receive. Each call fails soft (null) and the section hides.
  const [listing, statsRes, reviewsRes] = await Promise.all([
    apiGet("/api/properties?limit=12&sort=rating", { revalidate: 300 }),
    apiGet("/api/properties/stats", { revalidate: 1800 }),
    apiGet("/api/reviews/featured", { revalidate: 1800 }),
  ]);

  return (
    <>
      {/* Before first paint: skip the intro loader after the first visit this session. */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
      <HomeClient
        initialProperties={listing?.properties ?? []}
        stats={statsRes?.stats ?? null}
        reviews={reviewsRes?.reviews ?? []}
      />
    </>
  );
}
