import HomeClient from "./HomeClient";
import { pageMetadata, SITE_URL, SITE_NAME } from "../lib/site";
import { CITIES, cityPath } from "../lib/cities";
import { CONTACT_EMAIL, CONTACT_PHONES } from "../lib/contact";
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
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "PGCON Kerala",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512x512.png`, width: 512, height: 512 },
    description:
      "PGCON is a marketplace for verified PGs, hostels and co-living spaces across Kerala, India, with live bed availability, transparent rent and online booking.",
    areaServed: [
      { "@type": "State", name: "Kerala", containedInPlace: { "@type": "Country", name: "India" } },
      ...CITIES.map((c) => ({ "@type": "City", name: c.name, url: `${SITE_URL}${cityPath(c)}` })),
    ],
    knowsAbout: ["Paying guest accommodation", "Student hostels", "Co-living", "PG rentals in Kerala"],
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONES[0].tel,
    contactPoint: CONTACT_PHONES.map((p) => ({
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: p.tel,
      email: CONTACT_EMAIL,
      areaServed: "IN",
      availableLanguage: ["English", "Malayalam"],
    })),
    // Add official profiles here once they exist (Instagram, LinkedIn, Google Business Profile):
    // sameAs: ["https://www.instagram.com/…"],
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
