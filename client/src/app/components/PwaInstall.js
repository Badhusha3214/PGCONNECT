"use client";
import { useEffect, useState } from "react";

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
      } else {
        // In dev, chunk URLs aren't content-hashed, so a cached worker would
        // keep serving stale code after edits. Remove any left from before.
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
      }
    }

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    setDismissed(localStorage.getItem("pg_pwa_dismissed") === "1");

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("pg_pwa_dismissed", "1");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-2xl shadow-xl border p-4 bg-white dark:bg-slate-800" style={{ borderColor: "var(--pg-border)" }}>
      <div className="flex items-start gap-3">
        <img src="/icon-192x192.png" alt="PGCON" className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "var(--pg-text)" }}>Install PGCON</p>
          {deferredPrompt ? (
            <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>Add the app to your home screen for a faster, app-like experience.</p>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>
              Tap the Share icon, then &quot;Add to Home Screen&quot; to install.
            </p>
          )}
          <div className="flex gap-2 mt-3">
            {deferredPrompt && (
              <button onClick={install} className="text-xs font-bold text-white px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: "var(--pg-primary)" }}>
                Install
              </button>
            )}
            <button onClick={dismiss} className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer" style={{ color: "var(--pg-text-secondary)" }}>
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
