/** @type {import('next').NextConfig} */
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");

const nextConfig = {
  // Browsers reach Supabase through our own origin (/sb/*) so logins still
  // work on networks/ISPs or extensions that block *.supabase.co.
  async rewrites() {
    return SUPABASE_URL ? [{ source: "/sb/:path*", destination: `${SUPABASE_URL}/:path*` }] : [];
  },
  // The old Vercel address still serves the site; send it (permanently) to the
  // real domain so Google never splits ranking between two hosts. Preview
  // deployments use other hostnames and are unaffected.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "pgconnect-zeta.vercel.app" }],
        destination: "https://www.pgcon.in/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
