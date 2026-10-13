"use client";
import { useCallback, useEffect, useState } from "react";

// One small on-screen message for dashboards, used instead of alert():
//   const [toast, showToast] = useToast();
//   showToast("Payout requested");             // success
//   showToast("Couldn't update", "error");     // error
//   <Toast toast={toast} onClose={() => showToast(null)} />
export function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((text, type = "success") => setToast(text ? { text, type } : null), []);
  useEffect(() => {
    if (!toast) return;
    // Errors stay longer so there's time to read what went wrong.
    const t = setTimeout(() => setToast(null), toast.type === "error" ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [toast]);
  return [toast, show];
}

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className="fixed bottom-6 right-6 left-6 sm:left-auto z-[60] sm:max-w-sm flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg"
      style={{ background: isError ? "#B42318" : "var(--pg-ink)" }}
    >
      <span className="flex-1">{toast.text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="shrink-0 font-bold cursor-pointer opacity-80 hover:opacity-100">×</button>
    </div>
  );
}
