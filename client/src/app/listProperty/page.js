"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createProperty, getCurrentUser } from "../api";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AMENITIES = ["Wi-Fi", "AC", "Laundry", "Kitchen", "Security", "Gym"];
const ROOM_TYPES = ["Default", "Single", "Double", "Triple", "More than 3"];

export default function ListProperty() {
  return (
    <Suspense fallback={null}>
      <ListPropertyForm />
    </Suspense>
  );
}

function ListPropertyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (mounted) setCheckingAuth(false); return; }
      try {
        const res = await getCurrentUser();
        if (mounted) setUser(res?.user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const canListProperty = user && ["owner", "admin"].includes(user.role);

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    address: "",
    city: "",
    state: "",
    landmark: "",
    amenities: [],
    gender: "Boys",
    managerName: "",
    managerPhone: "",
    referral_code: searchParams?.get("ref") ?? "",
    agent_code: searchParams?.get("agent") ?? "",
    commission_option: "recurring",
  });

  const [rooms, setRooms] = useState([
    {
      type: "Default",
      price: "",
      totalBeds: "",
      description: "",
    },
  ]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const updateRoom = (index, field, value) => {
    setRooms((prev) => prev.map((room, roomIndex) => (
      roomIndex === index ? { ...room, [field]: value } : room
    )));
  };

  const addRoom = () => {
    setRooms((prev) => ([
      ...prev,
      {
        type: "Default",
        price: "",
        totalBeds: "",
        description: "",
      },
    ]));
  };

  const removeRoom = (index) => {
    setRooms((prev) => prev.filter((_, roomIndex) => roomIndex !== index));
  };

  const buildPropertyPayload = () => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("tagline", form.tagline.trim());
    fd.append("address", form.address.trim());
    fd.append("city", form.city.trim());
    fd.append("state", form.state.trim());
    fd.append("landmark", form.landmark.trim());
    fd.append("gender", form.gender);
    fd.append("manager_name", form.managerName.trim());
    fd.append("manager_phone", form.managerPhone.trim());
    fd.append("amenities", form.amenities.join(","));
    fd.append("commission_option", form.commission_option);
    if (form.referral_code.trim()) fd.append("referral_code", form.referral_code.trim());
    if (form.agent_code.trim()) fd.append("agent_code", form.agent_code.trim());
    fd.append("rooms", JSON.stringify(rooms.map((room) => ({
      type: room.type,
      price: Number(room.price),
      total_beds: Number(room.totalBeds),
      description: room.description.trim(),
    }))));
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasInvalidRoom = rooms.some((room) => !room.price || !room.totalBeds);

    if (!form.name || !form.address || !form.city || !form.state || !form.managerName || rooms.length === 0 || hasInvalidRoom) {
      setSubmitError("Please fill in the required fields.");
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    try {
      const payload = buildPropertyPayload();
      const response = await createProperty(payload);

      const listing = {
        propertyName: form.name,
        location: `${form.address}, ${form.city}, ${form.state}${form.landmark ? ` (${form.landmark})` : ""}`,
        pricePerBed: form.roomPrice,
        totalBeds: rooms[0]?.totalBeds || "",
        amenities: form.amenities,
        images: [],
        verified: false,
        submittedAt: new Date().toISOString(),
        apiResponse: response,
      };

      localStorage.setItem("pg_listing", JSON.stringify(listing));
      setSubmitted(true);
      setTimeout(() => router.push("/listingPending"), 1500);
    } catch (error) {
      console.error("Error creating property:", {
        status: error?.status,
        data: error?.data,
        message: error?.message,
      });
      setSubmitError(error?.message || "Failed to create property.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>

      <div className="min-h-screen bg-[var(--pg-bg)] text-[var(--pg-text)] flex flex-col">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-10 sm:pt-14 pb-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--pg-text)] tracking-tight">List Your Property</h1>
          <p className="mt-3 text-[var(--pg-text-tertiary)] text-sm sm:text-base max-w-lg leading-relaxed">
            Reach thousands of students looking for verified PG accommodation across Kerala.
          </p>
        </div>

        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 w-full flex-1 flex items-start justify-center">
          <div className="max-w-3xl w-full">
            {checkingAuth && (
              <div className="bg-white dark:bg-slate-800 border border-[var(--pg-border)] rounded-2xl p-10 shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 animate-spin text-[var(--pg-primary)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            )}

            {!checkingAuth && !user && (
              <div className="bg-white dark:bg-slate-800 border border-[var(--pg-border)] rounded-2xl p-8 sm:p-10 shadow-sm text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--pg-primary)" }}>
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[var(--pg-text)]">Create a free account to list your PG</h2>
                <p className="mt-2 text-sm text-[var(--pg-text-secondary)] max-w-sm mx-auto">
                  We ask owners to sign in so you can manage your listing, track inquiries, and receive payouts — it only takes a minute.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => router.push("/register?role=owner&next=/listProperty")}
                    className="w-full sm:w-auto bg-[var(--pg-accent)] hover:bg-[var(--pg-accent-dark)] text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => router.push("/signin?next=/listProperty")}
                    className="w-full sm:w-auto border border-[var(--pg-border)] text-[var(--pg-text)] text-sm font-semibold px-6 py-3 rounded-xl hover:border-[var(--pg-primary)] hover:text-[var(--pg-primary)] transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {!checkingAuth && user && !canListProperty && (
              <div className="bg-white dark:bg-slate-800 border border-[var(--pg-border)] rounded-2xl p-8 sm:p-10 shadow-sm text-center">
                <h2 className="text-xl font-bold text-[var(--pg-text)]">This account can't list properties</h2>
                <p className="mt-2 text-sm text-[var(--pg-text-secondary)] max-w-sm mx-auto">
                  You're signed in as a {user.role}. Only property owner accounts can list a PG — sign in with an owner account, or create a new one.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push("/register?role=owner&next=/listProperty")}
                    className="bg-[var(--pg-accent)] hover:bg-[var(--pg-accent-dark)] text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Create Owner Account
                  </button>
                </div>
              </div>
            )}

            {!checkingAuth && canListProperty && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-[var(--pg-border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
                  {submitError}
                </div>
              )}

              <section className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Property Name</label>
                  <input
                    type="text"
                    placeholder="Nirmal Jyothi"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Tagline</label>
                  <input
                    type="text"
                    placeholder="Modern co-living in Koramangala"
                    value={form.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Address</label>
                  <input
                    type="text"
                    placeholder="5th Block"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    required
                    className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">City</label>
                    <input
                      type="text"
                      placeholder="Chanaganassery"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      required
                      className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">State</label>
                    <input
                      type="text"
                      placeholder="Kerala"
                      value={form.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      required
                      className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Landmark</label>
                  <input
                    type="text"
                    placeholder="Near Forum Mall"
                    value={form.landmark}
                    onChange={(e) => updateField("landmark", e.target.value)}
                    className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-3">Gender</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {["Boys", "Girls", "Co-ed"].map((option) => {
                      const active = form.gender === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateField("gender", option)}
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all text-left ${active ? "border-[var(--pg-primary)] bg-[var(--pg-chip-bg)] text-[var(--pg-primary)]" : "border-[var(--pg-border)] bg-white dark:bg-slate-800 text-[var(--pg-text)] hover:border-[var(--pg-border)]"}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-3">Amenities</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {AMENITIES.map((amenity) => {
                      const checked = form.amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium text-left transition-all cursor-pointer ${checked ? "border-[var(--pg-primary)] bg-[var(--pg-chip-bg)] text-[var(--pg-primary)]" : "border-[var(--pg-border)] bg-white dark:bg-slate-800 text-[var(--pg-text)] hover:border-[var(--pg-border)]"}`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${checked ? "bg-[var(--pg-primary)] border-[var(--pg-primary)]" : "border-[var(--pg-border)]"}`}>
                            {checked && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="2 6 5 9 10 3" />
                              </svg>
                            )}
                          </div>
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-3">Room Details</label>
                  <div className="space-y-4">
                    {rooms.map((room, index) => (
                      <div key={index} className="rounded-2xl border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--pg-text)]">Room {index + 1}</p>
                            <p className="text-xs text-[var(--pg-text-tertiary)]">Add pricing and capacity for this room type.</p>
                          </div>
                          {rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRoom(index)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Room Type</label>
                            <select
                              value={room.type}
                              onChange={(e) => updateRoom(index, "type", e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-[var(--pg-border)] focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] outline-none transition-all"
                            >
                              {ROOM_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Price</label>
                            <input
                              type="number"
                              placeholder="15000"
                              value={room.price}
                              onChange={(e) => updateRoom(index, "price", e.target.value)}
                              min="0"
                              required
                              className="w-full bg-white dark:bg-slate-800 border border-[var(--pg-border)] focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Total Beds</label>
                            <input
                              type="number"
                              placeholder="10"
                              value={room.totalBeds}
                              onChange={(e) => updateRoom(index, "totalBeds", e.target.value)}
                              min="1"
                              required
                              className="w-full bg-white dark:bg-slate-800 border border-[var(--pg-border)] focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Description</label>
                          <textarea
                            rows={3}
                            placeholder={index === 0 ? "Twin beds" : "Add room details"}
                            value={room.description}
                            onChange={(e) => updateRoom(index, "description", e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-[var(--pg-border)] focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addRoom}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--pg-border)] bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-[var(--pg-text)] hover:border-blue-400 hover:text-[var(--pg-primary)] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Add room
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Manager Name</label>
                    <input
                      type="text"
                      placeholder="Rajesh Kumar"
                      value={form.managerName}
                      onChange={(e) => updateField("managerName", e.target.value)}
                      required
                      className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Manager Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={form.managerPhone}
                      onChange={(e) => updateField("managerPhone", e.target.value)}
                      className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Referral section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)]">Referral (Optional)</h3>
                <div className="bg-[var(--pg-chip-bg)] border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-[var(--pg-primary)] font-medium mb-3">
                    Were you referred by a student? Enter their code to link them to this listing — they'll earn 2% commission on every booking.
                  </p>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Referral Code</label>
                    <input
                      type="text"
                      placeholder="e.g. ABC12345"
                      value={form.referral_code}
                      onChange={(e) => updateField("referral_code", e.target.value.toUpperCase())}
                      className="w-full bg-white dark:bg-slate-800 border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all font-mono tracking-widest"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Commission Type for Referrer</label>
                    <div className="flex gap-3">
                      {[
                        { value: "recurring", label: "Recurring (2% monthly)" },
                        { value: "one-time", label: "One-Time (first booking only)" },
                      ].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border text-xs font-medium transition-all ${form.commission_option === opt.value ? "border-blue-500 bg-[var(--pg-chip-bg)] text-[var(--pg-primary)]" : "border-[var(--pg-border)] text-[var(--pg-text-secondary)] hover:border-blue-300"}`}>
                          <input type="radio" name="commission_option" value={opt.value} checked={form.commission_option === opt.value} onChange={() => updateField("commission_option", opt.value)} className="sr-only" />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Agent section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)]">Onboarding Agent (Optional)</h3>
                <div className="bg-[var(--pg-bg)] border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-[var(--pg-text-secondary)] font-medium mb-3">
                    Did an onboarding agent help you list here? Enter their agent code to connect this property to them.
                  </p>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-2">Agent Code</label>
                    <input
                      type="text"
                      placeholder="e.g. XYZ98765"
                      value={form.agent_code}
                      onChange={(e) => updateField("agent_code", e.target.value.toUpperCase())}
                      className="w-full bg-white dark:bg-slate-800 border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-[var(--pg-text)] placeholder-slate-400 outline-none transition-all font-mono tracking-widest"
                    />
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--pg-bg)] border border-[var(--pg-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--pg-text)]">Ready to list your property?</p>
                  <p className="text-xs text-[var(--pg-text-tertiary)] mt-0.5">Your listing will be reviewed by the team before going live. Usually takes 1-2 business days.</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting || submitted}
                  className="shrink-0 bg-[var(--pg-primary)] hover:bg-[var(--pg-primary)] active:scale-[0.98] transition-all text-white font-bold text-sm px-5 py-3 rounded-xl cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating…
                    </>
                  ) : submitted ? "✓ Submitted" : "Create Property"}
                </button>
              </div>
            </form>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}