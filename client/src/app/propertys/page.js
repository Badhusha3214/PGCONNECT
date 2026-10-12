"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllProperties } from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useDismissableOverlay } from "../../lib/useDismissableOverlay";

const AMENITY_ICONS = {
  wifi: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
  meals: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  ac: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>,
  gym: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4M6 12h12"/></svg>,
  laundry: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><circle cx="7" cy="6" r="1" fill="currentColor"/></svg>,
  security: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const SORT_OPTIONS = ["Price: Low to High", "Price: High to Low", "Rating", "Distance", "Newest"];
const ITEMS_PER_PAGE = 8;

const AMENITY_ICON_MAP = {
  wifi: "wifi",
  internet: "wifi",
  ac: "ac",
  airconditioning: "ac",
  airconditioner: "ac",
  gym: "gym",
  laundry: "laundry",
  security: "security",
  meals: "meals",
  food: "meals",
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getAmenityIconKey = (amenity) => {
  const normalized = String(amenity || "").toLowerCase().replace(/[^a-z]/g, "");
  if (AMENITY_ICON_MAP[normalized]) return AMENITY_ICON_MAP[normalized];
  if (normalized.includes("wifi") || normalized.includes("internet")) return "wifi";
  if (normalized.includes("ac") || normalized.includes("aircondition")) return "ac";
  if (normalized.includes("gym")) return "gym";
  if (normalized.includes("laundry")) return "laundry";
  if (normalized.includes("security")) return "security";
  if (normalized.includes("meal") || normalized.includes("food")) return "meals";
  return null;
};

const getInitialBudget = (priceLabel) => {
  if (priceLabel === "Under ₹10k") return [5000, 9999];
  if (priceLabel === "₹10k–₹20k") return [10000, 20000];
  if (priceLabel === "Above ₹20k") return [20001, 50000];
  return [5000, 25000];
};

const haversineKm = (a, b) => {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const formatShortDate = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
};

const toISODate = (date) => date.toISOString().slice(0, 10);
const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const mapProperty = (property) => {
  const rooms = Array.isArray(property?.property_rooms) ? property.property_rooms : [];
  const room = rooms[0] || {};
  const availableBeds = Number(property?.available_beds ?? room?.available_beds ?? 0);

  return {
    id: property?.id,
    name: property?.name || "Untitled Property",
    location: property?.address || property?.city || "Unknown location",
    city: property?.city || "",
    state: property?.state || "",
    distance: property?.city && property?.landmark
      ? `${property.city} • ${property.landmark}`
      : property?.city || property?.landmark || "",
    rating: property?.rating ?? null,
    isNew: false,
    price: Number(property?.starting_price ?? room?.price ?? 0),
    badge: property?.is_verified || property?.status === "verified" ? "VERIFIED" : null,
    badgeStyle: "",
    badgeColor: "#0F3B33",
    tag: availableBeds > 0 ? `${availableBeds} Beds Left` : "Full",
    tagColor: availableBeds > 0 ? "var(--pg-accent)" : "#64748b",
    availableBeds,
    lat: property?.lat != null ? Number(property.lat) : null,
    lng: property?.lng != null ? Number(property.lng) : null,
    amenities: Array.isArray(property?.amenities) ? property.amenities : [],
    amenityIcons: Array.isArray(property?.amenities) ? property.amenities.map(getAmenityIconKey) : [],
    roomType: room?.type || (rooms.length > 1 ? "Multiple" : "Single"),
    gender: property?.gender || "Any",
    wishlist: false,
    image: property?.property_images?.[0]?.image_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=700&q=80",
  };
};

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function SearchResults() {
  return (
    <Suspense fallback={null}>
      <SearchResultsContent />
    </Suspense>
  );
}

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query params
  const qLocation = searchParams.get("location") || "";
  const qPrice = searchParams.get("price") || "Any Price";
  const qGender = searchParams.get("gender") || "Any Gender";
  const initialBudgetFilterActive = qPrice !== "Any Price";

  // Filter state
  const [budgetMin, setBudgetMin] = useState(() => (initialBudgetFilterActive ? getInitialBudget(qPrice)[0] : 0));
  const [budgetMax, setBudgetMax] = useState(() => (initialBudgetFilterActive ? getInitialBudget(qPrice)[1] : 50000));
  const [budgetActive, setBudgetActive] = useState(initialBudgetFilterActive);
  const [roomTypes, setRoomTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [gender, setGender] = useState(() => {
    if (qGender === "Any Gender") return "Any";
    return qGender;
  });
  const today = toISODate(new Date());
  const [moveIn, setMoveIn] = useState(today);
  const [sort, setSort] = useState("Price: Low to High");
  const [search, setSearch] = useState(qLocation);
  const [wishlist, setWishlist] = useState([2]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking-style search capsule
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [datesOpen, setDatesOpen] = useState(false);
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(1);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [language, setLanguage] = useState("EN");
  const [languageOpen, setLanguageOpen] = useState(false);

  const filtersDrawerRef = useDismissableOverlay(filtersOpen, () => setFiltersOpen(false));
  const datesPopoverRef = useDismissableOverlay(datesOpen, () => setDatesOpen(false));
  const guestsPopoverRef = useDismissableOverlay(guestsOpen, () => setGuestsOpen(false));
  const languagePopoverRef = useDismissableOverlay(languageOpen, () => setLanguageOpen(false));

  const LANGUAGES = ["EN", "ML", "HI"];

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setGeoError("Location isn't supported on this device.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMeActive(true);
        setSort("Distance");
        setLocating(false);
      },
      () => {
        setGeoError("Couldn't access your location.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const AMENITY_CHIPS = ["WiFi", "AC", "Gym", "Meals", "Laundry", "Security"];
  const ROOM_TYPES = ["Single", "Double", "Triple"];

  const toggleRoomType = (t) => setRoomTypes((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  const toggleAmenity = (a) => setAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);
  const toggleWishlist = (e, id) => { e.stopPropagation(); setWishlist((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); };

  useEffect(() => {
    let isMounted = true;

    const loadProperties = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getAllProperties({ limit: 100 });
        
        const list = Array.isArray(response?.properties) ? response.properties.map(mapProperty) : [];

        if (isMounted) {
          setProperties(list);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError("Unable to load properties right now.");
          setProperties([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  // Apply filters
  const withDistance = properties.map((p) => ({
    ...p,
    distanceKm: nearMeActive ? haversineKm(userCoords, p) : null,
  }));

  const filtered = withDistance
    .filter((p) => {
      if (budgetActive && (p.price < budgetMin || p.price > budgetMax)) return false;
      if (roomTypes.length > 0 && !roomTypes.includes(p.roomType)) return false;
      if (gender !== "Any" && p.gender !== "Co-ed" && p.gender !== gender) return false;
      // Chip labels ("Meals") and stored values ("meals", "Food") differ in
      // wording/case, so compare their normalized keys.
      if (amenities.length > 0 && !amenities.every((a) => p.amenityIcons.includes(getAmenityIconKey(a)))) return false;
      if (moveIn && p.availableBeds <= 0) return false;
      if (guests > 1 && p.availableBeds < guests) return false;
      const searchValue = search.toLowerCase();
      if (searchValue
        && !p.name.toLowerCase().includes(searchValue)
        && !p.location.toLowerCase().includes(searchValue)
        && !p.city.toLowerCase().includes(searchValue)
        && !p.state.toLowerCase().includes(searchValue)
      ) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      if (sort === "Rating") return (b.rating || 0) - (a.rating || 0);
      if (sort === "Distance") {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const buildPageButtons = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    const left = Math.max(2, safePage - 1);
    const right = Math.min(totalPages - 1, safePage + 1);

    if (left > 2) pages.push("...");
    for (let current = left; current <= right; current += 1) {
      pages.push(current);
    }
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const FilterSidebar = () => (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>Filters</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>Refine your sanctuary</p>
      </div>

      {/* Budget Range */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" style={{ color: "var(--pg-primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <span className="text-sm font-bold" style={{ color: "var(--pg-primary)" }}>Budget Range</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>₹{budgetMin.toLocaleString("en-IN")}</span>
          <span>₹{budgetMax.toLocaleString("en-IN")}+</span>
        </div>
        <input type="range" min={0} max={25000} step={500} value={budgetMin}
          onChange={(e) => { setBudgetActive(true); setBudgetMin(Number(e.target.value)); }}
          className="w-full cursor-pointer" style={{ accentColor: "var(--pg-primary)" }} />
        <input type="range" min={0} max={50000} step={500} value={budgetMax}
          onChange={(e) => { setBudgetActive(true); setBudgetMax(Number(e.target.value)); }}
          className="w-full cursor-pointer mt-1" style={{ accentColor: "var(--pg-primary)" }} />
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Room Type */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-[var(--pg-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 14h20"/></svg>
          <span className="text-sm font-bold text-[var(--pg-primary)]">Room Type</span>
        </div>
        <div className="space-y-2.5">
          {ROOM_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-3 cursor-pointer group">
              <motion.div
                whileTap={{ scale: 0.85 }}
                onClick={() => toggleRoomType(t)}
                className="w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 cursor-pointer"
                style={roomTypes.includes(t) ? { background: "var(--pg-primary)", borderColor: "var(--pg-primary)" } : { background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
              >
                {roomTypes.includes(t) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 6 5 9 10 3"/>
                  </svg>
                )}
              </motion.div>
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-[var(--pg-text)] transition-colors">{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Amenities */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amenities</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AMENITY_CHIPS.map((a) => (
            <motion.button key={a} whileTap={{ scale: 0.92 }} onClick={() => toggleAmenity(a)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
              style={amenities.includes(a) ? { background: "var(--pg-primary)", color: "white", borderColor: "var(--pg-primary)" } : { background: "var(--pg-surface)", color: "var(--pg-text-secondary)", borderColor: "var(--pg-border)" }}>
              {a}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* House Rules */}
      <button className="flex items-center gap-2 w-full text-left">
        <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">House Rules</span>
        <svg className="w-4 h-4 text-slate-500 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Gender Preference */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gender Preference</span>
        </div>
        <div className="flex gap-2">
          {["Any", "Boys", "Girls", "Co-ed"].map((g) => (
            <button key={g} onClick={() => setGender(g)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={gender === g ? { background: "var(--pg-primary)", color: "white", borderColor: "var(--pg-primary)" } : { background: "var(--pg-surface)", color: "var(--pg-text-secondary)", borderColor: "var(--pg-border)" }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Move-in Date */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Move-in Date</span>
        </div>
        <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }} />
      </div>

      {/* Apply */}
      <button onClick={() => setFiltersOpen(false)} className="w-full active:scale-[0.98] text-white font-bold text-sm py-3 rounded-xl transition-all cursor-pointer" style={{ background: "var(--pg-primary)" }}>
        Apply Filters
      </button>
    </div>
  );

  return (
    <>

      <div className="min-h-screen flex flex-col" style={{ background: "var(--pg-bg)", color: "var(--pg-text)" }}>

        <Navbar />

        {/* ── SEARCH BAR ── */}
        <div id="main-content">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8">
            <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar bg-white rounded-[28px] p-2.5" style={{ boxShadow: "var(--pg-shadow-float)" }}>

              {/* Location + Near Me */}
              <div className="relative flex-1 min-w-[220px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Around Me"
                  value={search} onChange={(e) => { setSearch(e.target.value); setNearMeActive(false); }}
                  className="w-full h-full bg-[var(--pg-bg)] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-20 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                <button onClick={handleNearMe} disabled={locating}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors disabled:cursor-wait"
                  style={nearMeActive ? { background: "var(--pg-primary)", color: "white" } : { background: "var(--pg-surface)", color: "var(--pg-primary)" }}>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {locating ? "Locating…" : "Near me"}
                </button>
              </div>

              {/* Dates */}
              <div className="relative shrink-0">
                <button onClick={() => { setDatesOpen((v) => !v); setGuestsOpen(false); setLanguageOpen(false); }}
                  className="h-full flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer hover:border-blue-300 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatShortDate(moveIn)} – {formatShortDate(checkOut)}
                </button>
                {datesOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDatesOpen(false)} />
                    <div ref={datesPopoverRef} className="absolute z-50 top-full mt-2 left-0 bg-white dark:bg-slate-800 border rounded-xl shadow-xl p-4 w-64 space-y-3" style={{ borderColor: "var(--pg-border-soft)" }}>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Move-in</label>
                        <input type="date" value={moveIn} min={today}
                          onChange={(e) => { setMoveIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 1)); }}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 outline-none" style={{ borderColor: "var(--pg-border)", color: "var(--pg-text)" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Move-out (est.)</label>
                        <input type="date" value={checkOut} min={addDays(moveIn, 1)}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 outline-none" style={{ borderColor: "var(--pg-border)", color: "var(--pg-text)" }} />
                      </div>
                      <button onClick={() => setDatesOpen(false)} className="w-full text-white text-xs font-bold py-2 rounded-lg cursor-pointer" style={{ background: "var(--pg-primary)" }}>
                        Done
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Rooms & Guests */}
              <div className="relative shrink-0">
                <button onClick={() => { setGuestsOpen((v) => !v); setDatesOpen(false); setLanguageOpen(false); }}
                  className="h-full flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer hover:border-blue-300 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {rooms} Room{rooms > 1 ? "s" : ""}, {guests} Guest{guests > 1 ? "s" : ""}
                </button>
                {guestsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setGuestsOpen(false)} />
                    <div ref={guestsPopoverRef} className="absolute z-50 top-full mt-2 right-0 bg-white dark:bg-slate-800 border rounded-xl shadow-xl p-4 w-56 space-y-4" style={{ borderColor: "var(--pg-border-soft)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rooms</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setRooms((r) => Math.max(1, r - 1))} aria-label="Decrease rooms" className="relative w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold cursor-pointer before:content-[''] before:absolute before:-inset-2" style={{ borderColor: "var(--pg-border)", color: "var(--pg-primary)" }}>−</button>
                          <span className="text-sm font-bold w-4 text-center">{rooms}</span>
                          <button onClick={() => setRooms((r) => Math.min(5, r + 1))} aria-label="Increase rooms" className="relative w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold cursor-pointer before:content-[''] before:absolute before:-inset-2" style={{ borderColor: "var(--pg-border)", color: "var(--pg-primary)" }}>+</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Guests</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Decrease guests" className="relative w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold cursor-pointer before:content-[''] before:absolute before:-inset-2" style={{ borderColor: "var(--pg-border)", color: "var(--pg-primary)" }}>−</button>
                          <span className="text-sm font-bold w-4 text-center">{guests}</span>
                          <button onClick={() => setGuests((g) => Math.min(10, g + 1))} aria-label="Increase guests" className="relative w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold cursor-pointer before:content-[''] before:absolute before:-inset-2" style={{ borderColor: "var(--pg-border)", color: "var(--pg-primary)" }}>+</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Search */}
              <button onClick={() => { setDatesOpen(false); setGuestsOpen(false); setLanguageOpen(false); setPage(1); }}
                className="btn-shine shrink-0 flex items-center gap-2 text-white font-bold text-[15px] px-6 min-h-[48px] rounded-full cursor-pointer" style={{ background: "var(--pg-terracotta)", boxShadow: "0 12px 28px -10px rgba(180,70,31,.7)" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Search
              </button>

              {/* Filters */}
              <button onClick={() => setFiltersOpen(true)}
                className="shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer whitespace-nowrap hover:border-blue-300 hover:text-[var(--pg-primary)] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filters
                {(budgetActive || roomTypes.length > 0 || amenities.length > 0 || gender !== "Any" || moveIn !== today) && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--pg-primary)" }} />
                )}
              </button>

              {/* Language */}
              <div className="relative shrink-0">
                <button onClick={() => { setLanguageOpen((v) => !v); setDatesOpen(false); setGuestsOpen(false); }}
                  className="h-full flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-blue-300 transition-colors">
                  {language}
                  <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {languageOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLanguageOpen(false)} />
                    <div ref={languagePopoverRef} className="absolute z-50 top-full mt-2 right-0 bg-white dark:bg-slate-800 border rounded-xl shadow-xl py-1 w-24" style={{ borderColor: "var(--pg-border-soft)" }}>
                      {LANGUAGES.map((l) => (
                        <button key={l} onClick={() => { setLanguage(l); setLanguageOpen(false); }}
                          className="w-full text-left px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50"
                          style={l === language ? { color: "var(--pg-primary)", fontWeight: 700 } : { color: "var(--pg-text)" }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            {geoError && <p className="text-xs text-red-500 mt-2">{geoError}</p>}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 pt-10 pb-6 gap-7">

          {/* ── FILTER DRAWER ── */}
          <AnimatePresence>
            {filtersOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/40" onClick={() => setFiltersOpen(false)} />
                <motion.div
                  ref={filtersDrawerRef}
                  initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-800 overflow-y-auto p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-base font-bold text-[var(--pg-text)]">Filters</span>
                    <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="p-3 text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <FilterSidebar />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── RESULTS ── */}
          <div className="flex-1 min-w-0">

            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div className="flex flex-col gap-3">
                <span className="eyebrow">Find a PG</span>
                <h1 className="display m-0 font-extrabold" style={{ fontSize: "clamp(34px, 4vw, 56px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                  {loading ? "Finding beds…" : <>{filtered.length} PG{filtered.length === 1 ? "" : "s"} {search ? <>in <span style={{ color: "var(--pg-terracotta)" }}>{search}</span></> : <>across <span style={{ color: "var(--pg-terracotta)" }}>Kerala</span></>}</>}
                </h1>
                <p className="m-0 text-base text-[var(--pg-text-secondary)]">Verified listings with real bed availability.</p>
              </div>
              {/* Sort */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Sort By</span>
                <div className="relative">
                  <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-400 cursor-pointer">
                    {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* ── PROPERTY GRID ── */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="pg-skeleton h-[430px] rounded-2xl border border-slate-200 dark:border-slate-700" />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex-col">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div key={safePage} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginated.map((p) => (
                <div key={p.id}>
                <div className="lift bg-[var(--pg-surface)] rounded-[30px] p-2.5 flex flex-col h-full cursor-pointer" onClick={() => router.push(`/property/${p.id}`)}>
                  <div className="relative h-[220px] rounded-[22px] overflow-hidden" style={{ background: "linear-gradient(160deg, #D59A6A 0%, #8C5A3C 100%)" }}>
                    <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute top-3.5 left-3.5 z-[2] text-xs font-bold px-[11px] py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.92)", color: "#10231F" }}>
                      {p.gender === "Girls" || p.gender === "Boys" ? p.gender : "Co-ed"}
                    </span>
                    <span className="absolute bottom-3.5 left-3.5 z-[2] text-xs font-bold px-[11px] py-1.5 rounded-full text-white" style={{ background: p.availableBeds > 0 && p.availableBeds <= 2 ? "#B4461F" : "#10231F" }}>
                      {p.availableBeds > 0 ? `${p.availableBeds} bed${p.availableBeds === 1 ? "" : "s"} left` : "Full right now"}
                    </span>
                    <button
                      onClick={(e) => toggleWishlist(e, p.id)}
                      aria-label={wishlist.includes(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                      aria-pressed={wishlist.includes(p.id)}
                      className="absolute top-2.5 right-2.5 z-[2] w-11 h-11 rounded-full grid place-items-center cursor-pointer"
                      style={{ background: "rgba(255,255,255,.92)" }}
                    >
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={wishlist.includes(p.id) ? "#B4461F" : "none"} stroke={wishlist.includes(p.id) ? "#B4461F" : "#5B6762"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="px-3.5 pt-[18px] pb-3.5 flex flex-col gap-3.5 flex-1">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <h3 className="display m-0 text-[21px] font-bold tracking-[-0.025em] truncate">{p.name}</h3>
                        <span className="text-sm truncate" style={{ color: "#5B6762" }}>
                          {p.distance || p.location}{p.distanceKm != null ? ` · ${p.distanceKm.toFixed(1)} km` : ""}
                        </span>
                      </div>
                      <div className="text-right flex flex-col gap-0.5 shrink-0">
                        <span className="display text-[21px] font-extrabold whitespace-nowrap">{formatCurrency(p.price)}</span>
                        <span className="text-xs whitespace-nowrap" style={{ color: "#5B6762" }}>per bed / month</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[13px] font-semibold mt-auto">
                      {p.rating ? <span className="bg-white rounded-full px-3 py-[7px]"><span style={{ color: "#B4461F" }}>★</span> {Number(p.rating).toFixed(1)}</span> : null}
                      {p.amenities.slice(0, 3).map((a, i) => (
                        <span key={a} className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-[7px] capitalize">
                          {p.amenityIcons[i] && AMENITY_ICONS[p.amenityIcons[i]]}{a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              ))}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <svg className="w-12 h-12 text-slate-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p className="text-lg font-bold text-slate-500">No PGs match your filters</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your budget or room type.</p>
                <button onClick={() => { setRoomTypes([]); setAmenities([]); setBudgetActive(false); setBudgetMin(0); setBudgetMax(50000); setGender("Any"); setSearch(""); setPage(1); }}
                  className="mt-4 text-sm font-semibold cursor-pointer" style={{ color: "var(--pg-primary)" }}>
                  Clear all filters
                </button>
              </div>
            )}

            {/* ── LOAD MORE ── */}
            {!loading && !error && filtered.length > 0 && (
              <div className="flex flex-col items-center mt-10 gap-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={safePage === 1}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-blue-300 hover:text-[var(--pg-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Prev
                  </button>

                  <div className="flex items-center gap-1.5">
                    {buildPageButtons().map((p, i) => (
                      typeof p === "number" ? (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all cursor-pointer"
                          style={p === safePage ? { background: "var(--pg-primary)", color: "white" } : { color: "var(--pg-text-secondary)" }}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={`dots-${i}`} className="px-1 text-slate-500 text-sm">...</span>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={safePage === totalPages}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-blue-300 hover:text-[var(--pg-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} results
                </p>
              </div>
            )}

            <div className="h-12" />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}