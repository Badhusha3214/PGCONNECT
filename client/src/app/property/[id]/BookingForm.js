"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createBooking } from "../../api";

const GENDER_NOTE = {
  Boys: "This is a Boys-only PG.",
  Girls: "This is a Girls-only PG.",
};

export default function BookingForm({ propertyId, rooms, gender }) {
  const router = useRouter();
  const availableRooms = rooms.filter((r) => (r.available_beds ?? 0) > 0);

  const [roomType, setRoomType] = useState(availableRooms[0]?.type || "");
  const [moveInDate, setMoveInDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  // Once a request goes through, lock the form so it can't be sent twice.
  const [sent, setSent] = useState(false);

  const selectedRoom = availableRooms.find((r) => r.type === roomType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!roomType || !moveInDate) {
      setFeedback({ type: "error", text: "Please select a room type and move-in date." });
      return;
    }

    try {
      setSubmitting(true);
      const response = await createBooking({
        property_id: propertyId,
        room_type: roomType,
        move_in_date: moveInDate,
        monthly_rent: selectedRoom?.price ?? 0,
        notes: notes.trim() || undefined,
      });
      if (response?.success) {
        setFeedback({
          type: "success",
          text: "Booking request sent! You can track it in My bookings. Once the owner confirms, pay your first month's rent there.",
        });
        setSent(true);
      } else {
        setFeedback({ type: "error", text: "Unable to request booking right now." });
      }
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        router.push(`/signin?next=${encodeURIComponent(`/property/${propertyId}`)}`);
        return;
      }
      setFeedback({ type: "error", text: error?.message || "Failed to request booking. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (availableRooms.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--pg-border)] bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[var(--pg-text)]">Book Your Stay</h2>
        <p className="mt-3 text-sm text-[var(--pg-text-secondary)]">No beds are currently available for booking. Send an inquiry instead and the owner will notify you.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[var(--pg-border)] bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[var(--pg-text)]">Book Your Stay</h2>
      {GENDER_NOTE[gender] && (
        <p className="mt-2 mb-0 text-xs font-semibold rounded-lg px-3 py-2" style={{ background: "#FFF4D6", color: "#5A3E00" }}>
          {GENDER_NOTE[gender]} Please check before requesting a bed.
        </p>
      )}
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-1.5">Room Type</label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          >
            {availableRooms.map((r) => (
              <option key={r.type} value={r.type}>
                {r.type} — ₹{Number(r.price).toLocaleString("en-IN")}/mo ({r.available_beds} beds left)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-1.5">Move-in Date</label>
          <input
            type="date"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything the owner should know"
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className={`text-xs ${feedback.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {feedback.text}
              </p>
              {feedback.type === "success" && (
                <button
                  type="button"
                  onClick={() => router.push("/payments")}
                  className="mt-2 text-xs font-semibold text-[var(--pg-primary)] hover:underline cursor-pointer"
                >
                  View my bookings →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: submitting ? 1 : 1.02 }}
          whileTap={{ scale: submitting ? 1 : 0.97 }}
          type="submit"
          disabled={submitting || sent}
          className="w-full rounded-xl bg-[var(--pg-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pg-accent-dark)] disabled:cursor-not-allowed disabled:opacity-70 shadow-sm hover:shadow-md"
        >
          {sent ? "Request sent ✓" : submitting ? "Sending request..." : "Request to Book"}
        </motion.button>
      </form>
    </div>
  );
}
