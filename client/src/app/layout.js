import { Bricolage_Grotesque, Figtree, Manjari, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PwaInstall from "./components/PwaInstall";
import { SITE_URL, DEFAULT_OG_IMAGE } from "../lib/site";

// Design system fonts: Bricolage Grotesque (headings), Figtree (body),
// Manjari (Malayalam), JetBrains Mono (labels). Exposed as CSS variables
// that globals.css maps to .display / .ml / .mono and Tailwind's font-*.
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["400", "600", "700", "800"], display: "swap" });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const manjari = Manjari({ variable: "--font-manjari", subsets: ["latin", "malayalam"], weight: ["400", "700"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["500"], display: "swap" });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PGCON | Verified PGs and Co-living Spaces",
    template: "%s | PGCON",
  },
  description: "Find verified PGs and co-living spaces with transparent pricing, room availability, amenities, and manager details.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "PGCON",
    title: "PGCON | Verified PGs and Co-living Spaces",
    description: "Compare verified PG listings, amenities, pricing, and availability in one place.",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "PGCON | Verified PGs and Co-living Spaces",
    description: "Compare verified PG listings, amenities, pricing, and availability in one place.",
    images: [DEFAULT_OG_IMAGE.url],
  },
  category: "real-estate",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PGCON",
  },
  // favicon.ico is picked up from src/app automatically (Next adds its own
  // cache-busting hash). "?v=pgcon" busts cached copies of the old blue "PG"
  // PNG icons. Regenerate all of them from public/brand/pgcon-mark-1024.png.
  icons: {
    icon: [
      { url: "/icon-192x192.png?v=pgcon", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png?v=pgcon", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=pgcon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F3EE",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${figtree.variable} ${manjari.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[var(--pg-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <PwaInstall />
      </body>
    </html>
  );
}
