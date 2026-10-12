"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import AuthShell, { labelCls, inputCls, primaryBtnCls } from "../components/AuthShell";

// Step 1 of password reset: ask Supabase to email a recovery link. The link
// lands on /reset-password (see the email template in
// backend/email-templates/reset-password.html).
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) { setError("Enter the email address you signed up with."); return; }
    setError("");
    setSending(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    // Rate limits are worth surfacing; everything else gets the same neutral
    // message so the page never reveals whether an account exists.
    if (err && /rate|limit|seconds/i.test(err.message)) { setError("Too many requests — please wait a minute and try again."); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Reset link"
        accent="sent."
        intro={`If an account exists for ${email.trim()}, you'll get an email with a link to choose a new password. It can take a minute or two.`}
        footer={<p className="m-0 text-[15px] text-[var(--pg-text-secondary)]">Remembered it? <Link href="/signin" className="font-bold">Back to log in</Link></p>}
      >
        <div className="rounded-[22px] p-5 flex flex-col gap-2 text-[15px]" style={{ background: "var(--pg-bg)" }}>
          <span className="font-bold">Didn&apos;t get it?</span>
          <span className="text-[var(--pg-text-secondary)]">Check spam or promotions, and make sure you used the email you registered with. The link expires after one hour.</span>
          <button type="button" onClick={() => setSent(false)} className="self-start mt-1 font-bold text-[var(--pg-terracotta)] cursor-pointer">Try a different email</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Let's get you"
      accent="back in."
      intro="Enter the email you signed up with and we'll send you a link to set a new password."
      footer={<p className="m-0 text-[15px] text-[var(--pg-text-secondary)]">Remembered it? <Link href="/signin" className="font-bold">Back to log in</Link></p>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <div role="alert" className="text-sm font-medium px-4 py-3 rounded-2xl" style={{ background: "var(--pg-danger-bg)", color: "var(--pg-danger)" }}>{error}</div>}
        <div>
          <label htmlFor="email" className={labelCls}>Email address</label>
          <input id="email" type="email" autoComplete="email" autoFocus placeholder="name@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <button type="submit" disabled={sending} className={`${primaryBtnCls} mt-2`} style={{ background: "var(--pg-terracotta)", boxShadow: "0 12px 28px -10px rgba(180,70,31,.7)" }}>
          {sending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
