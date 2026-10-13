"use client";
import { useState } from "react";
import { createListingOrder, verifyListingPayment } from "../api";

const DAY = 24 * 60 * 60 * 1000;
const RENEW_WINDOW_DAYS = 30;

const formatDate = (v) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load the payment window. Check your connection."));
    document.head.appendChild(script);
  });

// Works out what the owner should see for one property's listing.
const describe = (p) => {
  const paidUntil = p.listing_paid_until ? new Date(p.listing_paid_until) : null;
  const daysLeft = paidUntil ? Math.ceil((paidUntil.getTime() - Date.now()) / DAY) : null;

  if (p.status === "unlisted") {
    return {
      tone: "warn",
      text: p.rejection_reason ? `Disabled by admin — ${p.rejection_reason}` : "Disabled by admin — hidden from search. Contact support.",
      canPay: false,
    };
  }
  if (p.status !== "verified") {
    return { tone: "muted", text: "Awaiting admin approval", canPay: false };
  }
  if (daysLeft === null || daysLeft <= 0) {
    return {
      tone: "warn",
      text: paidUntil ? `Listing expired ${formatDate(paidUntil)} — hidden from search` : "Approved — pay the listing fee to appear in search",
      canPay: true,
      cta: paidUntil ? "Renew" : "Pay & go live",
    };
  }
  const label = p.free_listing_slot ? "Live · free launch offer" : "Live";
  if (daysLeft <= RENEW_WINDOW_DAYS) {
    return { tone: "warn", text: `${label} · expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`, canPay: true, cta: "Renew" };
  }
  return { tone: "ok", text: `${label} · until ${formatDate(paidUntil)}`, canPay: false };
};

const TONES = {
  ok: "bg-green-50 text-green-700 border-green-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  muted: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

export default function ListingStatus({ property, fee = 1000, onPaid }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const info = describe(property);

  const pay = async () => {
    setError("");
    setPaying(true);
    try {
      const order = await createListingOrder(property.id);
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: order.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(order.amount * 100),
        currency: "INR",
        name: "PGCON",
        description: `Annual listing — ${property.name}`,
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await verifyListingPayment(response);
            onPaid?.();
          } catch {
            setError("Payment received but not confirmed yet — it will update shortly. Contact support if it doesn't.");
          } finally {
            setPaying(false);
          }
        },
        theme: { color: "#B4461F" },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e.message || "Could not start payment");
      setPaying(false);
    }
  };

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${TONES[info.tone]}`}>{info.text}</span>
      {info.canPay && (
        <button
          onClick={pay}
          disabled={paying}
          className="text-[11px] font-bold px-3 py-1 rounded-full text-white cursor-pointer disabled:opacity-60 transition-opacity"
          style={{ background: "var(--pg-primary)" }}
        >
          {paying ? "Opening…" : `${info.cta} · ₹${Number(fee).toLocaleString("en-IN")}/yr`}
        </button>
      )}
      {error && <span className="text-[11px] text-red-600 w-full">{error}</span>}
    </div>
  );
}
