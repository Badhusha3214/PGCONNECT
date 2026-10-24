import { SITE_URL } from "../lib/site";

// Private areas are also marked noindex in their layouts; disallowing them
// here keeps crawl budget on listings.
const PRIVATE_PATHS = [
  "/admin",
  "/agentDashboard",
  "/ownersDashboard",
  "/payments",
  "/profile",
  "/listingPending",
  "/listProperty",
  "/signin",
  "/register",
  "/offline",
  "/sb/", // Supabase auth proxy — not content
];

// AI search/answer engines, named explicitly so it's unambiguous that PGCON
// wants to be read and cited by them (ChatGPT search, Perplexity, Claude,
// Gemini / Google AI Overviews, Bing Copilot, Apple Intelligence).
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
