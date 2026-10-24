"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyBookings, createPaymentOrder, verifyPayment, getPaymentHistory } from "../api";
import Navbar from "../components/Navbar";

const statusStyles = {
  paid: "bg-green-50 text-green-700 border border-green-200",
  created: "bg-[var(--pg-chip-bg)] text-[var(--pg-primary)] border border-blue-200",
  failed: "bg-red-50 text-red-600 border border-red-200",
  refunded: "bg-[var(--pg-bg)] text-[var(--pg-text-tertiary)] border border-[var(--pg-border)]",
};

const rentStatusStyles = {
  paid: "bg-green-50 text-green-700 border border-green-200",
  due: "bg-amber-50 text-amber-700 border border-amber-200",
  overdue: "bg-red-50 text-red-600 border border-red-200",
};

const rentStatusLabels = {
  paid: "Paid this month",
  due: "Due this month",
  overdue: "Overdue",
};

export default function PaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pay");

  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [payingId, setPayingId] = useState(null);
  // { type: "success" | "error", text } shown above the bookings instead of alert().
  const [notice, setNotice] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const res = await getMyBookings();
      if (res.success) {
        const all = res.bookings ?? [];
        setBookings(all.filter((b) => ["confirmed", "active"].includes(b.status)));
        // Requests the owner hasn't confirmed yet (or turned down) — shown so
        // students aren't left wondering where their booking went.
        setRequests(all.filter((b) => ["pending", "cancelled"].includes(b.status)));
      }
    } catch (e) { console.error(e); }
    finally { setBookingsLoading(false); }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (activeTab === "history") {
      const load = async () => {
        try {
          setHistoryLoading(true);
          const res = await getPaymentHistory();
          if (res.success) setHistory(res.payments ?? []);
        } catch (e) { console.error(e); }
        finally { setHistoryLoading(false); }
      };
      load();
    }
  }, [activeTab]);

  const initiatePayment = async (booking) => {
    try {
      setPayingId(booking.id);
      const orderRes = await createPaymentOrder(booking.id);
      if (!orderRes.success) throw new Error(orderRes.message);

      // Load Razorpay script dynamically
      await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      const options = {
        key: orderRes.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(orderRes.amount * 100),
        currency: "INR",
        name: "PGCON",
        description: `Monthly Rent — ${booking.properties?.name ?? ""}`,
        order_id: orderRes.order_id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: orderRes.payment_id,
            });
            if (verifyRes.success) {
              setNotice({ type: "success", text: `Payment received — your rent for ${booking.properties?.name ?? "your PG"} is paid. A receipt is in Payment History.` });
              await loadBookings();
            }
          } catch (e) {
            // Razorpay already took the money at this point, so don't tell them it failed.
            setNotice({
              type: "error",
              text: `Your payment went through, but we couldn't confirm it yet (${e.message}). It usually updates within a few minutes — contact support with Razorpay ID ${response.razorpay_payment_id} if it doesn't.`,
            });
          } finally {
            setPayingId(null);
          }
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#B4461F" },
        modal: { ondismiss: () => setPayingId(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setNotice({ type: "error", text: `Payment failed: ${resp?.error?.description || "the bank declined it"}. No money was taken — please try again.` });
      });
      rzp.open();
    } catch (e) {
      setNotice({ type: "error", text: e.message || "Couldn't start the payment. Please try again." });
      setPayingId(null);
    }
  };

  const formatCurrency = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const formatDate = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <>

      <div className="min-h-screen bg-[var(--pg-bg)]">
        <Navbar />

        <div id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--pg-text)] mb-2">My bookings &amp; payments</h1>
          <p className="text-sm text-[var(--pg-text-tertiary)] mb-8">
            Track your booking requests, pay monthly rent and see your payment history.
          </p>

          {notice && (
            <div role={notice.type === "error" ? "alert" : "status"}
              className={`mb-6 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${notice.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-800"}`}>
              <span>{notice.text}</span>
              <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="shrink-0 font-bold cursor-pointer">×</button>
            </div>
          )}

          {/* Booking requests waiting on (or declined by) the owner */}
          {activeTab === "pay" && requests.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-3">Booking requests</h2>
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-[var(--pg-border)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      {r.properties?.property_images?.[0]?.image_url && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--pg-bg)] shrink-0">
                          <img src={r.properties.property_images[0].image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link href={`/property/${r.property_id}`} className="font-bold text-[var(--pg-text)] no-underline hover:underline">{r.properties?.name ?? "Property"}</Link>
                        <p className="text-sm text-[var(--pg-text-tertiary)]">
                          {r.properties?.city} · {r.room_type} room · move-in {formatDate(r.move_in_date)}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${r.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                        {r.status === "pending" ? "Waiting for the owner to confirm" : "Cancelled"}
                      </span>
                      <p className="text-xs text-[var(--pg-text-tertiary)] mt-1">
                        {r.status === "pending" ? "You can pay rent here once it's confirmed." : "Try another PG or send the owner an inquiry."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-[var(--pg-bg)] rounded-xl p-1 mb-8 w-fit">
            {[{ id: "pay", label: "Pay Rent" }, { id: "history", label: "Payment History" }].map((tab) => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                  ${activeTab === tab.id ? "bg-white dark:bg-slate-800 text-[var(--pg-text)] shadow-sm" : "text-[var(--pg-text-tertiary)] hover:text-[var(--pg-text)]"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* PAY RENT */}
          {activeTab === "pay" && (
            <div className="space-y-4">
              {bookingsLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[var(--pg-border)] p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading your bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[var(--pg-border)] p-12 text-center">
                  <p className="text-3xl mb-3">🏠</p>
                  <p className="text-sm font-semibold text-[var(--pg-text)]">No active bookings</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You don't have any confirmed bookings at the moment.</p>
                  <button onClick={() => router.push("/propertys")}
                    className="mt-4 text-sm font-semibold text-[var(--pg-primary)] hover:text-[var(--pg-primary)] cursor-pointer">
                    Browse Properties →
                  </button>
                </div>
              ) : bookings.map((booking) => {
                const rentStatus = booking.rent_status;
                const isPaid = rentStatus === "paid";
                const monthLabel = booking.current_month
                  ? new Date(booking.current_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                  : "this month";
                return (
                  <div key={booking.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-[var(--pg-border)] p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {booking.properties?.property_images?.[0]?.image_url && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--pg-bg)] shrink-0">
                            <img src={booking.properties.property_images[0].image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[var(--pg-text)]">{booking.properties?.name ?? "Property"}</p>
                          <p className="text-sm text-[var(--pg-text-tertiary)]">{booking.properties?.city} · {booking.room_type} room</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rentStatusStyles[rentStatus] || rentStatusStyles.due}`}>
                              {rentStatusLabels[rentStatus] || "Due this month"}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">for {monthLabel}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-[var(--pg-text)]">{formatCurrency(booking.monthly_rent)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">/month</p>
                        <button
                          onClick={() => initiatePayment(booking)}
                          disabled={payingId === booking.id || isPaid}
                          className={`mt-3 active:scale-[.98] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed block w-full text-center ${rentStatus === "overdue" ? "bg-red-600 hover:bg-red-700" : "bg-[var(--pg-primary)] hover:bg-[var(--pg-primary)]"}`}>
                          {isPaid ? "Paid ✓" : payingId === booking.id ? "Opening..." : rentStatus === "overdue" ? "Pay Overdue Rent" : "Pay Now"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAYMENT HISTORY */}
          {activeTab === "history" && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[var(--pg-border)] overflow-hidden">
              {historyLoading ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading payment history...</div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-3xl mb-3">📋</p>
                  <p className="text-sm font-semibold text-[var(--pg-text)]">No payments yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your payment history will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        {["Property", "Month", "Amount", "Platform Fee", "Status", "Date"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-6 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {history.map((p) => (
                        <tr key={p.id} className="hover:bg-[var(--pg-bg)]/60 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-[var(--pg-text)]">{p.properties?.name ?? "—"}</td>
                          <td className="px-6 py-4 text-sm text-[var(--pg-text-secondary)]">
                            {p.month ? new Date(p.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-[var(--pg-text)]">{formatCurrency(p.amount)}</td>
                          <td className="px-6 py-4 text-sm text-[var(--pg-text-tertiary)]">{formatCurrency(p.platform_fee)}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusStyles[p.status] || statusStyles.created}`}>
                              {p.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--pg-text-tertiary)]">{formatDate(p.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
