// Single source of truth for the public site URL and per-page SEO metadata.

if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === "production") {
  console.warn(
    "[seo] NEXT_PUBLIC_SITE_URL is not set — canonicals, sitemap and Open Graph URLs will point at localhost. Set it before deploying."
  );
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const SITE_NAME = "PGCON";
export const DEFAULT_OG_IMAGE = { url: "/og", width: 1200, height: 630, alt: "PGCON — verified PGs and hostels in Kerala" };

// Builds title/description/canonical/Open Graph/Twitter together so they never
// drift apart. `title` is run through the root "%s | PGCON" template unless
// `absoluteTitle` is set.
export function pageMetadata({ title, absoluteTitle, description, path, images, noindex = false }) {
  const fullTitle = absoluteTitle || `${title} | ${SITE_NAME}`;
  const ogImages = images?.length ? images : [DEFAULT_OG_IMAGE];

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: path ? { canonical: path } : undefined,
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImages.map((img) => img.url),
    },
  };
}

// For logged-in / transactional pages that should never appear in search.
export const privateMetadata = (title) => ({
  title,
  robots: { index: false, follow: false },
});
