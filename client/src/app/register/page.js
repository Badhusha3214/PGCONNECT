"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import AuthShell from "../components/AuthShell";
import { userRegister } from "../api";

const STEPS = ["Account", "Personal", "Preferences"];

const universities = [
  "IIT Delhi", "IIT Bombay", "IIT Bangalore", "IIT Madras",
  "Delhi University", "Mumbai University", "Anna University",
  "VIT Vellore", "BITS Pilani", "NIT Trichy", "Jadavpur University",
  "Other",
];

export default function Register() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") || "";
  const initialRole = searchParams?.get("role") === "owner" ? "owner" : "student";
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    // Step 0 — Account
    role: initialRole,
    email: "",
    password: "",
    confirmPassword: "",
    // Step 1 — Personal
    firstName: "",
    lastName: "",
    phone: "",
    // Step 2 — Preferences (student)
    university: "",
    moveInDate: "",
    budget: "",
    gender: "",
    // Step 2 — Preferences (owner)
    propertyCity: "",
    propertiesCount: "",
    agreeTerms: false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Validation per step ─────────────────────────────
  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = "Enter a valid email.";
      if (form.password.length < 6) e.password = "At least 6 characters.";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match.";
    }
    if (step === 1) {
      if (!form.firstName.trim()) e.firstName = "First name required.";
      if (!form.lastName.trim()) e.lastName = "Last name required.";
      if (!form.phone.trim()) e.phone = "Phone number required.";
      if (form.role === "student" && !form.university) e.university = "Select your university.";
      if (form.role !== "owner" && !form.agreeTerms) e.agreeTerms = "You must accept the terms.";
    }
    if (step === 2) {
      if (form.role === "owner" && !form.agreeTerms) e.agreeTerms = "You must accept the terms.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // dynamic last step: students and agents finish on step 1, owners on step 2
  const lastStep = form.role === "owner" ? 2 : 1;

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
      };
      if (form.role === "student") {
        payload.university = form.university;
      }

      await userRegister(payload);
      setSubmitted(true);
      const signinUrl = nextPath ? `/signin?next=${encodeURIComponent(nextPath)}` : "/signin";
      setTimeout(() => router.push(signinUrl), 2000);
    } catch (err) {
      console.error('Registration error:', { status: err?.status, data: err?.data, message: err?.message });

      // If server returned field-level validation errors, merge them into `errors`
      if (err?.data && typeof err.data === 'object') {
        // Common API shape: { message: '...', errors: { field: 'msg' } }
        const serverErrors = err.data.errors || err.data.fieldErrors || null;
        if (serverErrors && typeof serverErrors === 'object') {
          setErrors(prev => ({ ...prev, ...serverErrors }));
        } else {
          setErrors(prev => ({ ...prev, submit: err.message || err.data.message || 'Registration failed' }));
        }
      } else {
        setErrors(prev => ({ ...prev, submit: err?.message || 'Registration failed' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-blue-500", "bg-green-500"][strength];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--pg-bg)] text-[var(--pg-text)]">
        <div className="max-w-[520px] w-full rounded-[36px] p-10 flex flex-col items-center text-center gap-5" style={{ background: "var(--pg-forest)", color: "#F5F3EE" }}>
          <span className="bed-free w-16 h-16 rounded-2xl grid place-items-center" style={{ background: "#FFD27A" }}>
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#2A1C00" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          <h1 className="display m-0 text-4xl font-extrabold tracking-[-0.04em]">You&apos;re all set!</h1>
          <p className="m-0 text-base" style={{ color: "rgba(245,243,238,.78)" }}>Your account has been created. Redirecting you to log in…</p>
        </div>
      </div>
    );
  }

  const signInHref = nextPath ? `/signin?next=${encodeURIComponent(nextPath)}` : "/signin";

  return (
    <AuthShell
      eyebrow={`Step ${step + 1} of ${lastStep + 1}`}
      title="Create your"
      accent="account."
      intro="Students find verified beds; owners list and manage their PGs."
      footer={
        <p className="m-0 text-[15px] text-[var(--pg-text-secondary)]">
          Already have an account? <Link href={signInHref} className="font-bold">Log in</Link>
        </p>
      }
    >
            <div className="bg-white rounded-[30px] overflow-hidden" style={{ boxShadow: "var(--pg-shadow-card)" }}>
              <form onSubmit={handleSubmit}>
                <div className="px-6 sm:px-8 pt-7 pb-7">
                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-2xl mb-4">
                      {errors.submit}
                    </div>
                  )}

                  {/* ── STEP 0: Account ── */}
                  {step === 0 && (
                    <div className="space-y-4">
                      {/* Role selector */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">I am a</label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { value: "student", label: "Student", desc: "Looking for a PG" },
                            { value: "owner", label: "Owner", desc: "Listing properties" },
                            { value: "agent", label: "Agent", desc: "Onboarding owners" },
                          ].map(r => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => set("role", r.value)}
                                      style={form.role === r.value ? { borderColor: "var(--pg-primary)", background: "var(--pg-chip-bg)" } : { borderColor: "var(--pg-border-soft)", background: "var(--pg-surface)" }}
                              className="text-left border-2 rounded-2xl p-3 transition-all"
                            >
                              <p className="text-sm font-bold" style={{ color: form.role === r.value ? "var(--pg-primary)" : "var(--pg-text)" }}>{r.label}</p>
                              <p className="text-[11px] mt-1 leading-snug" style={{ color: form.role === r.value ? "var(--pg-primary)" : "var(--pg-text-secondary)" }}>{r.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          placeholder="name@university.edu"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                        />
                        {errors.email && <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>{errors.email}</p>}
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => set("password", e.target.value)}
                            className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all pr-11" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-pointer before:content-[''] before:absolute before:-inset-1"
                          >
                            {showPassword ? (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {form.password && (
                          <div className="mt-2.5 flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : "bg-slate-200"}`} />
                            ))}
                          </div>
                        )}
                        {errors.password && <p className="text-xs text-red-600 mt-1.5">{errors.password}</p>}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showConfirm ? "text" : "password"}
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={(e) => set("confirmPassword", e.target.value)}
                            className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all pr-11" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-pointer before:content-[''] before:absolute before:-inset-1"
                          >
                            {showConfirm ? (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-red-600 mt-1.5">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  )}

                  {/* ── STEP 1: Personal ── */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--pg-text)]">Tell us about yourself</h2>
                        <p className="text-sm text-slate-500 mt-2">This helps us personalise your experience</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">First Name</label>
                          <input
                            type="text"
                            placeholder="Aditya"
                            value={form.firstName}
                            onChange={(e) => set("firstName", e.target.value)}
                            className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                          />
                          {errors.firstName && <p className="text-xs text-red-600 mt-1.5">{errors.firstName}</p>}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Last Name</label>
                          <input
                            type="text"
                            placeholder="Kapoor"
                            value={form.lastName}
                            onChange={(e) => set("lastName", e.target.value)}
                            className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                          />
                          {errors.lastName && <p className="text-xs text-red-600 mt-1.5">{errors.lastName}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          value={form.phone}
                          onChange={(e) => set("phone", e.target.value)}
                          className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                        />
                        {errors.phone && <p className="text-xs text-red-600 mt-1.5">{errors.phone}</p>}
                      </div>
                    {form.role === "student" && (

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">University / College</label>
                        <input
                          type="text"
                          placeholder="University of Example"
                          value={form.university}
                          onChange={(e) => set("university", e.target.value)}
                          className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                        />
                        {errors.university && <p className="text-xs text-red-600 mt-1.5">{errors.university}</p>}
                      </div>
                    )}

                    {form.role === "agent" && (
                      <div className="rounded-2xl border p-3.5" style={{ borderColor: "var(--pg-border)", background: "var(--pg-bg)" }}>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          You'll get a unique agent code after signing up. PG owners enter it when listing their
                          property to connect it to you. Your account needs a quick admin approval before the
                          code becomes active.
                        </p>
                      </div>
                    )}

                    {form.role !== "owner" && (
                      <label className="flex items-start gap-3 cursor-pointer mt-4">
                        <div
                          onClick={() => set("agreeTerms", !form.agreeTerms)}
                          className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer"
                          style={form.agreeTerms ? { background: "var(--pg-primary)", borderColor: "var(--pg-primary)" } : { borderColor: "var(--pg-border)" }}
                        >
                          {form.agreeTerms && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 leading-relaxed">
                          I agree to PG Connect's{" "}
                          <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "var(--pg-primary)" }}>Terms of Service</a> and{" "}
                          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "var(--pg-primary)" }}>Privacy Policy</a>.
                          I confirm I am 18 years or older.
                        </span>
                      </label>
                    )}

                    </div>
                  )}

                  {/* ── STEP 2: Preferences ── */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--pg-text)]">
                          {form.role === "student" ? "Your preferences" : "Your properties"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">Almost there — just a couple more details</p>
                      </div>

                      {form.role === "student" ? (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">University / College</label>
                            <div className="relative">
                              <select
                                value={form.university}
                                onChange={(e) => set("university", e.target.value)}
                                className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all appearance-none" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                              >
                                <option value="">Enter your university</option>
                                {universities.map(u => <option key={u}>{u}</option>)}
                              </select>
                              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                            {errors.university && <p className="text-xs text-red-600 mt-1.5">{errors.university}</p>}
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Preferred Move-in Date</label>
                            <input
                              type="date"
                              value={form.moveInDate}
                              onChange={(e) => set("moveInDate", e.target.value)}
                              className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Budget (₹)</label>
                              <div className="relative">
                                <select value={form.budget} onChange={(e) => set("budget", e.target.value)} className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-2xl px-4 py-3 text-sm text-[var(--pg-text)] outline-none transition-all appearance-none">
                                  <option value="">Any budget</option>
                                  <option>Under ₹8,000</option>
                                  <option>₹8,000 – ₹15,000</option>
                                  <option>₹15,000 – ₹25,000</option>
                                  <option>Above ₹25,000</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Room Type</label>
                              <div className="relative">
                                <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-2xl px-4 py-3 text-sm text-[var(--pg-text)] outline-none transition-all appearance-none">
                                  <option value="">Any</option>
                                  <option>Boys</option>
                                  <option>Girls</option>
                                  <option>Co-ed</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">City</label>
                            <input
                              type="text"
                              placeholder="e.g. Bangalore, Delhi"
                              value={form.propertyCity}
                              onChange={(e) => set("propertyCity", e.target.value)}
                              className="w-full border rounded-2xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all" style={{ background: "var(--pg-bg)", borderColor: "var(--pg-border)", color: "var(--pg-text)" }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Number of Properties</label>
                            <div className="relative">
                              <select value={form.propertiesCount} onChange={(e) => set("propertiesCount", e.target.value)} className="w-full bg-[var(--pg-bg)] border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-50 rounded-2xl px-4 py-3 text-sm text-[var(--pg-text)] outline-none transition-all appearance-none">
                                <option value="">Select</option>
                                <option>1</option>
                                <option>2–5</option>
                                <option>6–10</option>
                                <option>10+</option>
                              </select>
                              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Terms checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer mt-6">
                        <div
                          onClick={() => set("agreeTerms", !form.agreeTerms)}
                          className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer"
                          style={form.agreeTerms ? { background: "var(--pg-primary)", borderColor: "var(--pg-primary)" } : { borderColor: "var(--pg-border)" }}
                        >
                          {form.agreeTerms && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 leading-relaxed">
                          I agree to PG Connect's{" "}
                          <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "var(--pg-primary)" }}>Terms of Service</a> and{" "}
                          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "var(--pg-primary)" }}>Privacy Policy</a>.
                          I confirm I am 18 years or older.
                        </span>
                      </label>
                      {errors.agreeTerms && <p className="text-xs text-red-600">{errors.agreeTerms}</p>}
                    </div>
                  )}

                  {/* ── NAVIGATION BUTTONS ── */}
                  <div className="flex gap-3 mt-7">
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={back}
                        className="px-6 min-h-[52px] rounded-full border-[1.5px] border-[var(--pg-ink)] text-[var(--pg-ink)] font-bold text-base hover:bg-[var(--pg-ink)] hover:text-white transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    {step < lastStep ? (
                      <button
                        type="button"
                        onClick={next}
                        className="btn-shine flex-1 min-h-[52px] rounded-full text-white font-bold text-base cursor-pointer" style={{ background: "var(--pg-ink)" }}
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-shine flex-1 min-h-[52px] rounded-full text-white font-bold text-base cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: "var(--pg-terracotta)", boxShadow: "0 12px 28px -10px rgba(180,70,31,.7)" }}
                      >
                        {loading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Creating account…
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
    </AuthShell>
  );
}