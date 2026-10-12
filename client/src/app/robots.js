import { SITE_URL } from "../lib/site";

// Private areas are also marked noindex in their layouts; disallowing them
// here keeps crawl budget on listings.
const PRIVATE_PATHS = [
  "/admin",
  "/agentDashboard",
  "/ownersDashboard",
  "/referrerDashboard",
  "/payments",
  "/profile",
  "/listingPending",
  "/listProperty",
  "/signin",
  "/register",
  "/offline",
];

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
