import { ROOM_TYPES } from "../../lib/listing";
// Maps live API data onto what the landing design shows. Everything that
// reaches the page from here is real; illustrative sections use their own
// clearly-labelled sample data instead.

export const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80";

const SHARING_ORDER = ROOM_TYPES;

const hasAmenity = (p, key) => (p.amenities || []).some((a) => String(a).toLowerCase().replace(/[^a-z]/g, "").includes(key));

export const toPg = (p) => {
  const photos = (p.property_images || []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const types = [...new Set((p.property_rooms || []).map((r) => r.type).filter(Boolean))]
    .sort((a, b) => SHARING_ORDER.indexOf(a) - SHARING_ORDER.indexOf(b));
  const beds = Number(p.available_beds ?? 0);
  return {
    id: p.id,
    name: p.name || "Untitled PG",
    city: p.city || "",
    area: [p.address, p.city].filter(Boolean).join(" · "),
    near: p.landmark || "",
    price: Number(p.starting_price ?? 0),
    who: p.gender === "Girls" ? "Girls" : p.gender === "Boys" ? "Boys" : "Co-ed",
    bedsLeft: beds,
    sharing: types.length ? types.join(" · ") : "Rooms",
    food: hasAmenity(p, "meal") || hasAmenity(p, "food") ? "Meals included" : "No meals",
    rating: Number(p.rating ?? 0),
    ratings: Number(p.total_ratings ?? 0),
    photo: photos[0]?.image_url || FALLBACK_PHOTO,
  };
};

export const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const bedsLeftLabel = (n) => (n <= 0 ? "Full right now" : `${n} bed${n === 1 ? "" : "s"} left`);

export const reviewerName = (r) => {
  const first = r?.tenant?.first_name || "PGCON resident";
  const lastInitial = r?.tenant?.last_name?.[0];
  return lastInitial ? `${first} ${lastInitial}.` : first;
};

// Cities that actually have live listings.
export const citiesFrom = (stats, pgs) => {
  if (stats?.cities?.length) return stats.cities;
  return [...new Set(pgs.map((p) => p.city).filter(Boolean))];
};

// Budget bands for the hero search, sent to /propertys as ?budget=min-max.
export const BUDGETS = [
  { label: "Any budget", value: "" },
  { label: "Under ₹5,000", value: "0-4999" },
  { label: "₹5,000 – ₹7,000", value: "5000-7000" },
  { label: "₹7,000 – ₹9,000", value: "7000-9000" },
  { label: "Above ₹9,000", value: "9000-50000" },
];
