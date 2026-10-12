"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { userLogin } from "../api";
import AuthShell, { labelCls, inputCls, primaryBtnCls } from "../components/AuthShell";

export default function SignIn() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    try {
      const response = await userLogin({ email, password });
      setLoading(false);
      const role = response?.user?.role;
      // Admins always land in the admin panel — `next` is only meant to return
      // students/owners to the page they were trying to reach before signing in.
      if (role === "admin") { router.push("/admin"); return; }
      if (nextPath) { router.push(nextPath); return; }
      if (role === "student") { router.push("/referrerDashboard"); }
      else if (role === "owner") { router.push("/ownersDashboard"); }
      else { router.push("/"); }
    } catch (err) {
      setLoading(false);
      setError(`Login failed: ${err?.message || "Please try again."}`);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to"
      accent="PG Connect."
      intro="Pick up where you left off — saved PGs, bookings and payments."
      footer={
        <p className="m-0 text-[15px] text-[var(--pg-text-secondary)]">
          New here?{" "}
          <Link href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"} className="font-bold">Create an account</Link>
        </p>
      }
    >
      <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
        {searchParams?.get("reset") === "1" && !error && (
          <div role="status" className="text-sm font-medium px-4 py-3 rounded-2xl" style={{ background: "var(--pg-success-bg)", color: "var(--pg-success)" }}>Password updated — log in with your new password.</div>
        )}
        {error && (
          <div role="alert" className="text-sm font-medium px-4 py-3 rounded-2xl" style={{ background: "var(--pg-danger-bg)", color: "var(--pg-danger)" }}>{error}</div>
        )}

        <div>
          <label htmlFor="email" className={labelCls}>Email address</label>
          <input id="email" type="email" autoComplete="email" placeholder="name@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelCls}>Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold mb-1.5">Forgot password?</Link>
          </div>
          <div className="relative">
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-12`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full cursor-pointer text-[var(--pg-text-tertiary)] hover:text-[var(--pg-ink)]">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword
                  ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className={`${primaryBtnCls} mt-2`} style={{ background: "var(--pg-terracotta)", boxShadow: "0 12px 28px -10px rgba(180,70,31,.7)" }}>
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              Logging in…
            </>
          ) : "Log in"}
        </button>

        <p className="m-0 flex items-center justify-center gap-1.5 text-xs text-[var(--pg-text-tertiary)]">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          Your details are encrypted and never shared
        </p>
      </form>
    </AuthShell>
  );
}
