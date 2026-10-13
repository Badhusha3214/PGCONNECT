"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createInquiry, getCurrentUser } from "../../api";
import { getSession } from "../../../lib/supabase";

export default function InquiryForm({ propertyId }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    moveIn: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Signed-in students shouldn't have to retype their own name and phone.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!(await getSession())) return;
      try {
        const { user } = await getCurrentUser();
        if (!active || !user) return;
        const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
        setForm((prev) => ({ ...prev, name: prev.name || name, phone: prev.phone || user.phone || "" }));
      } catch {
        // not signed in or profile unavailable — leave the fields for manual entry
      }
    })();
    return () => { active = false; };
  }, []);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");

    if (!form.name || !form.phone || !form.moveIn || !form.message) {
      setFeedback("Please fill in your name, phone, move-in date and a message.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        property_id: propertyId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        move_in: form.moveIn,
        message: form.message.trim(),
      };

      const response = await createInquiry(payload);
      if (response?.success) {
        setFeedback("Inquiry sent! The owner has been notified and will contact you on the phone number you gave.");
        setForm((prev) => ({ ...prev, moveIn: "", message: "" }));
      } else {
        setFeedback("Unable to send inquiry right now.");
      }
    } catch (error) {
      const status = error?.status;
      if (status === 401 || status === 403) {
        router.push("/signin");
        return;
      }
      setFeedback(error?.message || "We couldn't send your inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-xl font-bold">Send Inquiry</h2>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
        />
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="Phone number"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
        />
        <input
          type="date"
          value={form.moveIn}
          onChange={(e) => onChange("moveIn", e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
        />
        <textarea
          value={form.message}
          onChange={(e) => onChange("message", e.target.value)}
          placeholder="Write your message"
          rows={4}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
        />

        <AnimatePresence>
          {feedback && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-slate-600 dark:text-slate-400 overflow-hidden"
            >
              {feedback}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: submitting ? 1 : 1.02 }}
          whileTap={{ scale: submitting ? 1 : 0.97 }}
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm hover:shadow-md"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Sending...
            </span>
          ) : "Send Inquiry"}
        </motion.button>
      </form>
    </div>
  );
}
