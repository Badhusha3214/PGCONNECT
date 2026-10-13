import { roomLabel } from "../../../lib/listing";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "../../../lib/site";
import { cache } from "react";
import InquiryForm from "./InquiryForm";
import BookingForm from "./BookingForm";
import ReviewForm from "./ReviewForm";
import Gallery from "./Gallery";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { apiGet } from "../../../lib/serverApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80";

const AMENITY_ICONS = {
  wifi: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  gym: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4M6 12h12" />
    </svg>
  ),
  security: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  meals: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    </svg>
  ),
  laundry: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <circle cx="12" cy="13" r="5" />
    </svg>
  ),
  ac: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
    </svg>
  ),
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getAmenityIconKey = (amenity) => {
  const normalized = String(amenity || "").toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.includes("wifi") || normalized.includes("internet")) return "wifi";
  if (normalized.includes("gym")) return "gym";
  if (normalized.includes("security")) return "security";
  if (normalized.includes("meal") || normalized.includes("food")) return "meals";
  if (normalized.includes("laundry")) return "laundry";
  if (normalized.includes("ac") || normalized.includes("aircondition")) return "ac";
  return null;
};

// preview=true is the owner's "see it as students do" view: always fresh, so
// photos/edits they just made show up immediately, and not counted as a view.
const getPropertyById = cache(async (id, preview = false) => {
  const response = await fetch(
    `${API_URL}/api/properties/${id}${preview ? "?preview=1" : ""}`,
    preview ? { cache: "no-store" } : { next: { revalidate: 300 } }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?.property || null;
});

const getPropertyReviews = cache(async (id) => {
  const response = await fetch(`${API_URL}/api/reviews/property/${id}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) return { reviews: [], total: 0 };
  const data = await response.json();
  return { reviews: data?.reviews ?? [], total: data?.total ?? 0 };
});

const GENDER_LABEL = { Boys: "Boys PG", Girls: "Girls PG", "Co-ed": "Co-ed PG" };

// ~150-160 chars: who it's for, where, room types, highlights, price, live availability.
const AMENITY_LABEL = { wifi: "WiFi", ac: "AC", tv: "TV", cctv: "CCTV" };
const formatAmenity = (a) => {
  const key = String(a || "").trim();
  return AMENITY_LABEL[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1);
};

const buildPropertyDescription = (property) => {
  const kind = GENDER_LABEL[property?.gender] || "PG";
  // Landmarks are often stored as "Near X" — strip it so we don't write "near Near X".
  const landmark = String(property?.landmark || "").replace(/^\s*near\s+/i, "");
  const place = [landmark, property?.city].filter(Boolean).join(", ") || "Kerala";
  const roomTypes = [...new Set((property?.property_rooms || []).map((r) => r.type).filter(Boolean))];
  const rooms = roomTypes.length ? `${roomTypes.join(", ")} rooms` : "Rooms";
  const highlights = (property?.amenities || []).slice(0, 3).map(formatAmenity).join(", ");
  const price = Number(property?.starting_price || 0);
  const beds = property?.available_beds ?? 0;

  const parts = [
    `${property?.is_verified ? "Verified " : ""}${kind} near ${place}.`,
    `${rooms}${price ? ` from ₹${price.toLocaleString("en-IN")}/month` : ""}.`,
    highlights ? `${highlights}.` : "",
    beds > 0 ? `${beds} bed${beds === 1 ? "" : "s"} available now.` : "Currently full, check back soon.",
  ].filter(Boolean);

  const text = parts.join(" ");
  return text.length <= 160 ? text : `${text.slice(0, 157).trimEnd()}…`;
};

const buildStructuredData = (property, propertyId, images) => {
  const url = `${SITE_URL}/property/${propertyId}`;
  const aggregateRating = property?.total_ratings > 0
    ? {
      "@type": "AggregateRating",
      ratingValue: property.rating || 0,
      ratingCount: property.total_ratings,
    }
    : undefined;

  const roomOffers = (property?.property_rooms || []).map((room) => ({
    "@type": "Offer",
    priceCurrency: "INR",
    price: room.price || 0,
    availability: room.available_beds > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemOffered: {
      "@type": "Accommodation",
      name: `${property.name} - ${room.type}`,
      description: room.description || `${room.type} room option`,
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: property?.name || "PG Property",
    description: buildPropertyDescription(property),
    url,
    image: images,
    address: {
      "@type": "PostalAddress",
      streetAddress: property?.address || "",
      addressLocality: property?.city || "",
      addressRegion: property?.state || "",
      addressCountry: "IN",
    },
    telephone: property?.manager_phone || property?.owner?.phone || "",
    amenityFeature: (property?.amenities || []).map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity,
      value: true,
    })),
    aggregateRating,
    makesOffer: roomOffers,
  };
};

export async function generateMetadata({ params, searchParams }) {
  const { id } = await params;
  const preview = (await searchParams)?.preview === "1";
  const property = await getPropertyById(id, preview);
  if (property && preview) {
    return { title: `Preview: ${property.name}`, robots: { index: false, follow: false } };
  }

  if (!property) {
    return {
      title: "Property Not Found",
      description: "This property could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const image = property?.property_images?.[0]?.image_url || FALLBACK_IMAGE;
  const genderLabel = GENDER_LABEL[property?.gender] || "PG";
  const price = Number(property?.starting_price || 0);
  const title = `${property.name}: ${genderLabel} in ${property?.city || "Kerala"}${price ? ` from ₹${price.toLocaleString("en-IN")}/mo` : ""}`;
  const description = buildPropertyDescription(property);
  const canonical = `/property/${id}`;

  return {
    // No "| PGCON" suffix: keeps property titles ~60 chars; brand is in og:site_name.
    title: { absolute: title },
    description,
    keywords: [
      property.name,
      property?.city,
      property?.address,
      `${property?.gender || "co-ed"} pg`,
      "verified pg",
      "co-living",
      "pg near me",
    ].filter(Boolean),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "PGCON",
      images: [
        {
          url: image,
          alt: `${property.name} cover image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// Shown only in ?preview=1 — tells the owner this is the student view and
// whether students can actually find the listing yet.
function PreviewBanner({ property }) {
  const paidUntil = property.listing_paid_until ? new Date(property.listing_paid_until).getTime() : 0;
  const live = property.status === "verified" && paidUntil > Date.now();
  const status = live
    ? "It's live — students can find it in search."
    : property.status === "verified"
      ? "Approved, but hidden from search until the listing fee is paid."
      : "Waiting for admin approval — students can't find it in search yet.";
  return (
    <div role="status" className="border-b" style={{ background: "#FFF4D6", borderColor: "#F2D48A" }}>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm" style={{ color: "#5A3E00" }}>
          <strong>Preview</strong> — this is how students see your PG. {status}
        </p>
        <Link href="/ownersDashboard" className="shrink-0 text-sm font-bold no-underline rounded-full px-4 py-2 text-white" style={{ background: "var(--pg-ink)" }}>
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default async function PropertyDetailPage({ params, searchParams }) {
  const { id } = await params;
  const preview = (await searchParams)?.preview === "1";
  const property = await getPropertyById(id, preview);

  if (!property) notFound();

  const { reviews, total: reviewsTotal } = await getPropertyReviews(id);
  const images = property?.property_images?.length
    ? property.property_images.slice().sort((a, b) => a.position - b.position).map((img) => img.image_url)
    : [FALLBACK_IMAGE];
  const rooms = Array.isArray(property?.property_rooms) ? property.property_rooms : [];
  const amenities = Array.isArray(property?.amenities) ? property.amenities : [];
  const schema = buildStructuredData(property, id, images);
  const citySearchHref = `/propertys?location=${encodeURIComponent(property.city || "")}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `PGs in ${property.city || "Kerala"}`, item: `${SITE_URL}${citySearchHref}` },
      { "@type": "ListItem", position: 3, name: property.name },
    ],
  };
  // Server-rendered links to neighbouring listings, so every property is reachable by crawling.
  const nearby = property.city
    ? ((await apiGet(`/api/properties?city=${encodeURIComponent(property.city)}&limit=7`, { revalidate: 300 }))?.properties ?? [])
        .filter((p) => p.id !== property.id)
        .slice(0, 6)
    : [];

  const freeBeds = Number(property.available_beds ?? 0);
  const genderLabel = GENDER_LABEL[property.gender] || "PG";
  const card = "bg-white rounded-[30px] p-7";
  const h2 = "display m-0 text-[28px] font-bold tracking-[-0.03em]";

  return (
    <div className="min-h-screen bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, breadcrumbSchema]) }} />

      <Navbar />

      {preview && <PreviewBanner property={property} />}

      <main id="main-content" className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-8 pb-24">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="mono flex flex-wrap items-center gap-2 text-[12px] tracking-[.08em] uppercase text-[var(--pg-text-tertiary)] list-none m-0 p-0">
            <li><Link href="/" className="text-[var(--pg-text-tertiary)] no-underline hover:text-[var(--pg-terracotta)]">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={citySearchHref} className="text-[var(--pg-text-tertiary)] no-underline hover:text-[var(--pg-terracotta)]">PGs in {property.city || "Kerala"}</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate text-[var(--pg-ink)]">{property.name}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-3 max-w-[820px]">
            <span className="eyebrow">{genderLabel} · {property.city || "Kerala"}</span>
            <h1 className="display m-0 font-extrabold" style={{ fontSize: "clamp(40px, 5vw, 72px)", lineHeight: 0.98, letterSpacing: "-0.045em" }}>{property.name}</h1>
            {property.tagline && <p className="m-0 text-lg text-[var(--pg-text-secondary)]">{property.tagline}</p>}
            <div className="flex flex-wrap gap-2 pt-1 text-sm font-semibold">
              {property.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "var(--pg-success-bg)", color: "var(--pg-success)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
                  Verified
                </span>
              )}
              {property.total_ratings > 0 && <span className="rounded-full bg-white px-3 py-1.5"><span style={{ color: "var(--pg-terracotta)" }}>★</span> {Number(property.rating).toFixed(1)} · {property.total_ratings} review{property.total_ratings === 1 ? "" : "s"}</span>}
              <span className="rounded-full px-3 py-1.5 text-white" style={{ background: freeBeds > 0 && freeBeds <= 2 ? "var(--pg-terracotta)" : "var(--pg-ink)" }}>{freeBeds > 0 ? `${freeBeds} bed${freeBeds === 1 ? "" : "s"} free` : "Full right now"}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-sm text-[var(--pg-text-tertiary)]">from</span>
            <span className="display font-extrabold" style={{ fontSize: 44, letterSpacing: "-0.04em", lineHeight: 1 }}>{formatCurrency(property.starting_price)}</span>
            <span className="block text-sm text-[var(--pg-text-tertiary)]">per bed / month</span>
          </div>
        </header>

        <section className="rounded-[36px] overflow-hidden bg-white mb-8" style={{ boxShadow: "var(--pg-shadow-card)" }}>
          <Gallery images={images} name={property.name} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] items-start">
          <div className="flex flex-col gap-6 min-w-0">
            {/* At a glance */}
            <section className="rounded-[30px] p-7 grid gap-4" style={{ background: "var(--pg-forest)", color: "#F5F3EE", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              {[
                ["Beds free", freeBeds],
                ["Total beds", property.total_beds || 0],
                ["Rating", property.total_ratings > 0 ? Number(property.rating).toFixed(1) : "New"],
                ["Enquiries", property.inquiries_count || 0],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <span className="mono text-[11px] tracking-[.14em] uppercase" style={{ color: "rgba(245,243,238,.6)" }}>{k}</span>
                  <span className="display text-[34px] font-extrabold tracking-[-0.04em]" style={{ color: k === "Beds free" ? "var(--pg-lamp)" : "#F5F3EE" }}>{v}</span>
                </div>
              ))}
            </section>

            {/* Rooms: each bed drawn, lit if free */}
            <section className={card}>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                <h2 className={h2}>Rooms &amp; beds</h2>
                <span className="flex gap-4 text-sm font-semibold text-[var(--pg-text-secondary)]">
                  <span className="inline-flex items-center gap-2"><span className="w-3.5 h-5 rounded" style={{ background: "#FFF1CC", border: "2px solid #D99A1E" }} />Free</span>
                  <span className="inline-flex items-center gap-2"><span className="w-3.5 h-5 rounded" style={{ background: "#E7E3D8", border: "1.5px dashed #A9A396" }} />Taken</span>
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {rooms.length === 0 && <p className="m-0 text-[var(--pg-text-secondary)]">Room details coming soon.</p>}
                {rooms.map((room) => {
                  const total = Number(room.total_beds || 0);
                  const free = Math.min(total, Number(room.available_beds ?? 0));
                  return (
                    <div key={room.id || room.type} className="rounded-[22px] p-5 flex flex-wrap items-center justify-between gap-4" style={{ background: "var(--pg-bg)" }}>
                      <div className="flex flex-col gap-1 min-w-[180px] flex-1">
                        <span className="display text-xl font-bold">{roomLabel(room.type)}</span>
                        {room.description && <span className="text-sm text-[var(--pg-text-secondary)]">{room.description}</span>}
                        <div className="flex flex-wrap gap-1.5 mt-2" aria-label={`${free} of ${total} beds free`}>
                          {Array.from({ length: Math.min(total, 40) }, (_, i) => (
                            <span key={i} aria-hidden="true" className={`w-[22px] h-[32px] rounded-md ${i < free ? "bed-free" : ""}`} style={i < free ? { background: "#FFF1CC", border: "2px solid #D99A1E" } : { background: "#E7E3D8", border: "1.5px dashed #A9A396" }} />
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="display text-2xl font-extrabold">{formatCurrency(room.price)}</span>
                        <span className="block text-sm text-[var(--pg-text-tertiary)]">{free}/{total} beds free</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Amenities + location */}
            <section className={card}>
              <h2 className={`${h2} mb-5`}>What&apos;s included</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.length === 0 && <span className="text-[var(--pg-text-secondary)]">Ask the manager for the amenity list.</span>}
                {amenities.map((amenity) => {
                  const iconKey = getAmenityIconKey(amenity);
                  return (
                    <span key={amenity} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-semibold capitalize" style={{ background: "var(--pg-bg)" }}>
                      {iconKey ? AMENITY_ICONS[iconKey] : null}
                      {amenity}
                    </span>
                  );
                })}
              </div>
              <div className="kasavu my-7 opacity-60" aria-hidden="true" />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="mono text-[11px] tracking-[.14em] uppercase text-[var(--pg-text-tertiary)]">Address</span>
                  <span className="font-semibold">{[property.address, property.city].filter(Boolean).join(", ") || "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="mono text-[11px] tracking-[.14em] uppercase text-[var(--pg-text-tertiary)]">Landmark</span>
                  <span className="font-semibold">{property.landmark || "—"}</span>
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section className={card}>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                <h2 className={h2}>Reviews from residents</h2>
                {property.total_ratings > 0 && (
                  <span className="text-sm font-bold"><span style={{ color: "var(--pg-terracotta)" }}>★</span> {Number(property.rating).toFixed(1)} <span className="font-normal text-[var(--pg-text-tertiary)]">({property.total_ratings})</span></span>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="m-0 text-[var(--pg-text-secondary)]">No reviews yet. Stayed here? Share your experience below.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviews.map((r) => (
                    <figure key={r.id} className="m-0 rounded-[22px] p-5 flex flex-col gap-3" style={{ background: "var(--pg-bg)" }}>
                      {r.comment && <blockquote className="display m-0 text-lg font-semibold leading-snug">“{r.comment}”</blockquote>}
                      <figcaption className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-bold">{r.tenant?.first_name || "Resident"} {r.tenant?.last_name?.[0] ? `${r.tenant.last_name[0]}.` : ""}</span>
                        <span aria-label={`${r.rating} out of 5`} style={{ color: "var(--pg-terracotta)" }}>{"★".repeat(r.rating)}<span style={{ color: "#DCD7CA" }}>{"★".repeat(5 - r.rating)}</span></span>
                        {r.is_verified_stay && <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "var(--pg-success-bg)", color: "var(--pg-success)" }}>Verified stay</span>}
                        <span className="ml-auto text-[var(--pg-text-tertiary)]">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </figcaption>
                    </figure>
                  ))}
                  {reviewsTotal > reviews.length && <p className="m-0 text-xs text-[var(--pg-text-tertiary)]">Showing {reviews.length} of {reviewsTotal} reviews</p>}
                </div>
              )}
              <div className="mt-6"><ReviewForm propertyId={id} /></div>
            </section>
          </div>

          {/* Sticky action column */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
            <BookingForm propertyId={id} rooms={rooms} gender={property.gender} />
            <InquiryForm propertyId={id} />
            <div className="rounded-[30px] p-7 flex items-center gap-4" style={{ background: "var(--pg-terracotta)", color: "#fff" }}>
              <span className="w-12 h-12 rounded-2xl grid place-items-center shrink-0" style={{ background: "rgba(255,255,255,.16)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
              </span>
              <div className="flex flex-col min-w-0">
                <span className="mono text-[11px] tracking-[.14em]" style={{ color: "#FFE1CF" }}>MANAGER</span>
                <span className="display text-xl font-bold truncate">{property.manager_name || "PG manager"}</span>
                {property.manager_phone && <a href={`tel:${property.manager_phone}`} className="text-white font-semibold">{property.manager_phone}</a>}
              </div>
            </div>
          </aside>
        </div>

        {nearby.length > 0 && (
          <section aria-labelledby="nearby-heading" className="mt-20 flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-3">
                <span className="eyebrow">Nearby</span>
                <h2 id="nearby-heading" className="display m-0 font-extrabold" style={{ fontSize: "clamp(32px, 3.6vw, 52px)", lineHeight: 1, letterSpacing: "-0.04em" }}>More PGs in {property.city}.</h2>
              </div>
              <Link href={citySearchHref} className="inline-flex items-center gap-2 font-bold text-[var(--pg-ink)] no-underline min-h-11">See all in {property.city} →</Link>
            </div>
            <ul className="list-none m-0 p-0 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))" }}>
              {nearby.map((p) => (
                <li key={p.id}>
                  <Link href={`/property/${p.id}`} className="lift no-underline text-[var(--pg-ink)] bg-white rounded-[30px] p-2.5 flex flex-col h-full">
                    <div className="relative h-[200px] rounded-[22px] overflow-hidden" style={{ background: "linear-gradient(160deg, #D59A6A 0%, #8C5A3C 100%)" }}>
                      <img src={p.property_images?.[0]?.image_url || FALLBACK_IMAGE} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      <span className="absolute top-3.5 left-3.5 text-xs font-bold px-[11px] py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.92)" }}>{GENDER_LABEL[p.gender] || "PG"}</span>
                    </div>
                    <div className="px-3.5 pt-4 pb-3 flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <span className="display block text-xl font-bold truncate">{p.name}</span>
                        <span className="block text-sm truncate text-[var(--pg-text-tertiary)]">{p.landmark || p.city}</span>
                      </div>
                      <span className="display text-xl font-extrabold whitespace-nowrap">{formatCurrency(p.starting_price)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
