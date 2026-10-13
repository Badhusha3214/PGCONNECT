"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPropertyById } from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ListingPending() {
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [property, setProperty] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const propertyId =
    listing?.apiResponse?.property?.id ||
    listing?.apiResponse?.id ||
    listing?.propertyId ||
    listing?.id ||
    null;

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("pg_listing") || "null");
    setListing(data);
  }, []);

  useEffect(() => {
    if (!propertyId) return;

    let active = true;

    const fetchStatus = async () => {
      setCheckingStatus(true);
      try {
        const response = await getPropertyById(propertyId);
        if (!active) return;

        const resolvedProperty = response?.property || response || null;
        setProperty(resolvedProperty);
      } catch (error) {
        if (active) {
          console.error("Error checking property verification:", error);
        }
      } finally {
        if (active) setCheckingStatus(false);
      }
    };

    fetchStatus();

    return () => {
      active = false;
    };
  }, [propertyId]);

  useEffect(() => {
    const verified = Boolean(property?.is_verified || property?.status === "verified" || listing?.verified);
    if (!verified) return;

    const target = propertyId ? `/property/${propertyId}` : "/propertys";
    const timer = setTimeout(() => {
      router.replace(target);
    }, 1600);

    return () => clearTimeout(timer);
  }, [listing?.verified, property?.is_verified, property?.status, propertyId, router]);

  const submittedAt = listing?.submittedAt
    ? new Date(listing.submittedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : property?.created_at
      ? new Date(property.created_at).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : null;

  const isVerified = Boolean(property?.is_verified || property?.status === "verified" || listing?.verified);

  const clearAndRelist = () => {
    localStorage.removeItem("pg_listing");
    router.push("/listProperty");
  };

  return (
    <>

      <div className="min-h-screen bg-[var(--pg-bg)] flex flex-col">

        <Navbar />

        {/* Main */}
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-lg">

            {/* Animated status icon */}
            <div className="flex justify-center mb-8">
              <div className="pulse-ring w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center float">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            {/* Status card */}
            <div className="bg-white dark:bg-slate-800 border border-[var(--pg-border)] rounded-2xl shadow-sm overflow-hidden">

              {/* Amber top bar */}
              <div className={`${isVerified ? "bg-green-500" : "bg-amber-400"} h-1.5 w-full`} />

              <div className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  {isVerified ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Verified Property
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--pg-text)] tracking-tight">Your property is verified</h1>
                      <p className="mt-2 text-sm text-[var(--pg-text-tertiary)] leading-relaxed">
                        We’re taking you to the property page now.
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        Pending Verification
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--pg-text)] tracking-tight">Your listing is under review</h1>
                      <p className="mt-2 text-sm text-[var(--pg-text-tertiary)] leading-relaxed">
                        Your PG is waiting for admin approval. It will appear in search once approved, usually within <strong className="text-[var(--pg-text)]">48 hours</strong>.
                      </p>
                    </>
                  )}
                </div>

                {/* Listing summary */}
                {(listing || property) && (
                  <div className="bg-[var(--pg-bg)] border border-[var(--pg-border)] rounded-xl p-4 mb-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Your Submission</p>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--pg-text)] truncate">{property?.name || listing?.propertyName}</p>
                        <p className="text-xs text-[var(--pg-text-tertiary)] mt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                          </svg>
                          {property
                            ? [property.address, property.city, property.landmark].filter(Boolean).join(", ")
                            : listing.location}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[var(--pg-primary)] text-sm">₹{Number(property?.starting_price || listing?.pricePerBed || 0).toLocaleString("en-IN")}/bed</p>
                        <p className="text-xs text-slate-500 mt-0.5">{property?.total_beds || listing?.totalBeds || 0} beds</p>
                      </div>
                    </div>
                    {((property?.amenities?.length > 0) || listing?.amenities?.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(property?.amenities || listing?.amenities || []).map((a) => (
                          <span key={a} className="bg-[var(--pg-chip-bg)] text-[var(--pg-primary)] text-[10px] font-semibold px-2 py-0.5 rounded-md">{a}</span>
                        ))}
                      </div>
                    )}
                    {submittedAt && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-[var(--pg-border)]">Submitted on {submittedAt}</p>
                    )}
                  </div>
                )}

                {/* Progress steps */}
                <div className="space-y-3 mb-6">
                  {[
                    { label: "Listing submitted", done: true },
                    { label: "Waiting for admin approval (24–48 hrs)", done: false, active: true },
                    { label: "Published & live on PGCON", done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                        ${step.done ? "bg-green-500 text-white" : step.active ? "bg-amber-400 text-white" : "bg-[var(--pg-chip-bg)] text-slate-500"}`}>
                        {step.done ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : step.active ? (
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : i + 1}
                      </div>
                      <span className={`text-sm ${step.done ? "text-green-700 font-medium" : step.active ? "text-amber-700 font-semibold" : "text-slate-500"}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* What's next */}
                <div className="bg-[var(--pg-chip-bg)] border border-blue-100 rounded-xl p-4 mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--pg-primary)] mb-2">What happens next?</p>
                  <ul className="space-y-1.5">
                    {[
                      "An admin reviews your listing details.",
                      "Track its status any time in your Owner Dashboard.",
                      "Once approved, your listing goes live in search.",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2 text-xs text-blue-800">
                        <svg className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push(isVerified && propertyId ? `/property/${propertyId}` : "/")}
                    className="flex-1 bg-[var(--pg-primary)] hover:bg-[var(--pg-primary)] active:scale-[0.98] text-white text-sm font-semibold py-3 rounded-xl transition-all cursor-pointer"
                  >
                    {isVerified && propertyId ? "View Property" : "Browse Properties"}
                  </button>
                  {!isVerified && propertyId && (
                    <a
                      href={`/property/${propertyId}?preview=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 grid place-items-center border border-[var(--pg-border)] bg-white text-[var(--pg-text)] text-sm font-semibold py-3 rounded-xl no-underline"
                    >
                      Preview listing
                    </a>
                  )}
                  <button
                    onClick={isVerified ? clearAndRelist : () => router.push("/ownersDashboard")}
                    className="flex-1 border border-[var(--pg-border)] hover:border-[var(--pg-border)] bg-white dark:bg-slate-800 text-[var(--pg-text)] text-sm font-semibold py-3 rounded-xl transition-all cursor-pointer"
                  >
                    {isVerified ? "Create New Listing" : "Go to Dashboard"}
                  </button>
                </div>

              </div>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              PGCON Verified Property Management
            </p>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}