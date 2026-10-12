"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { getCurrentUser, logout } from "../api";
import Logo from "./Logo";
import { useDismissableOverlay } from "../../lib/useDismissableOverlay";

const DASHBOARD_PATH = {
  student: "/referrerDashboard",
  owner: "/ownersDashboard",
  agent: "/agentDashboard",
  admin: "/admin",
};

const NAV_LINKS = [
  { label: "Find a PG", href: "/propertys" },
  { label: "How it works", href: "/how-it-works" },
  { label: "For parents", href: "/#parents" },
  { label: "List your PG", href: "/listProperty" },
];

const menuItem = "w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--pg-ink)] hover:bg-[var(--pg-surface-muted)] cursor-pointer transition-colors";

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const mobileMenuRef = useDismissableOverlay(menuOpen, () => setMenuOpen(false));
  const userMenuRef = useDismissableOverlay(userMenuOpen, () => setUserMenuOpen(false));

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (mounted) { setUser(null); setCheckingAuth(false); }
        return;
      }
      try {
        const res = await getCurrentUser();
        if (mounted) setUser(res?.user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    };

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => loadUser());
    return () => { mounted = false; subscription?.subscription?.unsubscribe(); };
  }, []);

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U"
    : "";

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setUserMenuOpen(false);
    router.push("/");
  };

  const goToDashboard = () => {
    setUserMenuOpen(false);
    router.push(DASHBOARD_PATH[user?.role] || "/profile");
  };

  const goToPayments = () => {
    setUserMenuOpen(false);
    router.push("/payments");
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(245,243,238,.86)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderColor: "rgba(16,35,31,.08)",
      }}
    >
      <nav aria-label="Main" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Logo size={38} />

        <div className="hidden md:flex items-center gap-7 text-[15px] font-medium">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="text-[var(--pg-ink)] no-underline hover:text-[var(--pg-terracotta)] transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {!checkingAuth && !user && (
            <>
              <Link href="/signin" className="hidden sm:inline-flex items-center min-h-11 px-3.5 text-[15px] font-semibold text-[var(--pg-ink)] no-underline rounded-full hover:bg-[var(--pg-surface-muted)] transition-colors">
                Log in
              </Link>
              <Link
                href="/propertys"
                className="btn-shine hidden sm:inline-flex items-center min-h-11 px-5 rounded-full text-[15px] font-semibold text-white no-underline"
                style={{ background: "var(--pg-ink)" }}
              >
                Find my bed
              </Link>
            </>
          )}

          {!checkingAuth && user && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer shrink-0"
                style={{ background: "var(--pg-forest)" }}
              >
                {initials}
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      ref={userMenuRef}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl py-2 z-50 origin-top-right"
                      style={{ boxShadow: "var(--pg-shadow-float)" }}
                    >
                      <p className="px-4 pb-2 mb-1 text-xs text-[var(--pg-text-tertiary)] truncate border-b border-[var(--pg-border-soft)]">
                        {user.first_name} {user.last_name}
                      </p>
                      {user.role === "student" ? (
                        <>
                          <button onClick={goToPayments} className={menuItem}>My bookings & payments</button>
                          <button onClick={goToDashboard} className={menuItem}>Referral program</button>
                        </>
                      ) : (
                        <button onClick={goToDashboard} className={menuItem}>Dashboard</button>
                      )}
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[var(--pg-danger)] hover:bg-[var(--pg-danger-bg)] cursor-pointer transition-colors">
                        Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            className="md:hidden w-11 h-11 grid place-items-center text-[var(--pg-ink)] hover:bg-[var(--pg-surface-muted)] rounded-full cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
              )}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-[var(--pg-border-soft)]"
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="py-2.5 text-base font-medium text-[var(--pg-ink)] no-underline">
                  {l.label}
                </Link>
              ))}
              <div className="kasavu my-3 opacity-60" aria-hidden="true" />
              {!checkingAuth && user ? (
                <>
                  {user.role === "student" ? (
                    <>
                      <button onClick={() => { goToPayments(); setMenuOpen(false); }} className="py-2.5 text-left text-base font-semibold text-[var(--pg-ink)] cursor-pointer">My bookings & payments</button>
                      <button onClick={() => { goToDashboard(); setMenuOpen(false); }} className="py-2.5 text-left text-base font-semibold text-[var(--pg-ink)] cursor-pointer">Referral program</button>
                    </>
                  ) : (
                    <button onClick={() => { goToDashboard(); setMenuOpen(false); }} className="py-2.5 text-left text-base font-semibold text-[var(--pg-ink)] cursor-pointer">Dashboard</button>
                  )}
                  <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="py-2.5 text-left text-base font-semibold text-[var(--pg-danger)] cursor-pointer">Sign out</button>
                </>
              ) : (
                <div className="flex gap-2.5 pt-1">
                  <Link href="/signin" onClick={() => setMenuOpen(false)} className="flex-1 inline-flex justify-center items-center min-h-12 rounded-full text-[15px] font-semibold text-[var(--pg-ink)] no-underline border border-[rgba(16,35,31,.18)]">
                    Log in
                  </Link>
                  <Link href="/propertys" onClick={() => setMenuOpen(false)} className="flex-1 inline-flex justify-center items-center min-h-12 rounded-full text-[15px] font-semibold text-white no-underline" style={{ background: "var(--pg-ink)" }}>
                    Find my bed
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
