export default function manifest() {
  return {
    name: "PG Connect | Verified PGs and Co-living Spaces",
    short_name: "PG Connect",
    description: "Find verified PGs and co-living spaces with transparent pricing, room availability, amenities, and manager details.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F3EE",
    theme_color: "#F5F3EE",
    orientation: "portrait-primary",
    categories: ["real-estate", "lifestyle"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
