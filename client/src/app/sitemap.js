import { SITE_URL } from "../lib/site";
import { CITIES, cityPath } from "../lib/cities";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const PAGE_SIZE = 100; // backend max page size
const MAX_PAGES = 500; // hard stop: 50k URLs is the sitemap protocol limit

async function fetchAllProperties() {
  const all = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await fetch(`${API_URL}/api/properties?limit=${PAGE_SIZE}&page=${page}`, {
        next: { revalidate: 1800 },
        // Don't let a stalled API hang the sitemap; the catch below serves what we have.
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) break;
      const data = await response.json();
      const batch = Array.isArray(data?.properties) ? data.properties : [];
      all.push(...batch);
      if (batch.length < PAGE_SIZE || page >= (data?.pages ?? 1)) break;
    }
  } catch {
    // Serve whatever we collected — a partial sitemap beats a failed one.
  }
  return all;
}

export default async function sitemap() {
  const properties = await fetchAllProperties();

  const staticRoutes = ["", "/propertys", "/how-it-works", "/help", "/about", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  // City landing pages are the main entry point from searches like "PG in Kochi".
  const cityRoutes = CITIES.map((city) => ({
    url: `${SITE_URL}${cityPath(city)}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const propertyRoutes = properties
    .filter((item) => item?.id)
    .map((item) => ({
      url: `${SITE_URL}/property/${item.id}`,
      ...(item.updated_at ? { lastModified: new Date(item.updated_at) } : {}),
    }));

  return [...staticRoutes, ...cityRoutes, ...propertyRoutes];
}
