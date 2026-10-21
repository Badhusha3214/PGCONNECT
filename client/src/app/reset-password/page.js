"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import AuthShell, { labelCls, inputCls, primaryBtnCls } from "../components/AuthShell";

// Step 2 of password reset. The emailed link arrives here in one of three
// shapes, depending on which Supabase template is active:
//   ?token_hash=…&type=recovery   (our template — works on any device)
//   ?code=…                       (Supabase default with PKCE — same browser only)
//   #access_token=…&type=recovery (legacy implicit flow)
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | ready | invalid
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const finish = (ok) => { if (!cancelled) setStatus(ok ? "ready" : "invalid"); };

    (async () => {
      const tokenHash = params.get("token_hash");
      const code = params.get("code");
      if (tokenHash) {
        const { error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: params.get("type") || "recovery" });
        return finish(!err);
      }
      if (code) {
        const { error: err } = await supabase.auth.exchangeCodeForSession(code);
        return finish(!err);
      }
      // Implicit flow: supabase-js picks the session out of the URL hash itself.
      const { data } = await supabase.auth.getSession();
      finish(!!data.session);
    })();

    return () => { cancelled = true; };
  }, [params]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("The two passwords don't match."); return; }
    setError("");
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setSaving(false);
      setError(/different from the old/i.test(err.message) ? "Choose a password you haven't used before." : err.message || "Couldn't update your password. Try again.");
      return;
    }
    // Make them log in with the new password so every session starts fresh.
    await supabase.auth.signOut();
    router.push("/signin?reset=1");
  };

  // An owner whose PG an agent/admin onboarded arrives here from their invite email.
  const invited = params.get("invited") === "1" || params.get("type") === "invite";
  const eyebrow = invited ? "Welcome to PGCON" : "Reset password";

  const back = <p className="m-0 text-[15px] text-[var(--pg-text-secondary)]"><Link href="/signin" className="font-bold">Back to log in</Link></p>;

  if (status === "verifying") {
    return (
      <AuthShell eyebrow={eyebrow} title="Checking your" accent="link…" intro="One moment while we verify your link." footer={back}>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--pg-surface-muted)" }}>
          <div className="h-full w-1/3 rounded-full pg-gradient-animated" style={{ background: "linear-gradient(90deg, #FFC447, #B4461F, #FFC447)" }} />
        </div>
      </AuthShell>
    );
  }

  if (status === "invalid") {
    return (
      <AuthShell eyebrow={eyebrow} title="This link has" accent="expired." intro={invited ? "Invite links work once. Enter your email on the next page and we'll send you a fresh link to set your password." : "Reset links work once and expire after an hour. Request a fresh one and use the newest email."} footer={back}>
        <Link href="/forgot-password" className={primaryBtnCls} style={{ background: "var(--pg-terracotta)", boxShadow: "0 12px 28px -10px rgba(180,70,31,.7)" }}>
          Send a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow={eyebrow} title={invited ? "Set your" : "Choose a new"} accent="password." intro={invited ? "Your PG is on PGCON. Choose a password (at least 8 characters) to manage it from your Owner Dashboard." : "Pick something you haven't used before — at least 8 characters."} footer={back}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <div role="alert" className="text-sm font-medium px-4 py-3 rounded-2xl" style={{ background: "var(--pg-danger-bg)", color: "var(--pg-danger)" }}>{error}</div>}
        <div>
          <label htmlFor="new-password" className={labelCls}>New password</label>
          <div className="relative">
            <input id="new-password" type={show ? "text" : "password"} autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-16`} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-2 rounded-full cursor-pointer text-[var(--pg-text-secondary)] hover:text-[var(--pg-ink)]">
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password" className={labelCls}>Confirm new password</label>
          <input id="confirm-password" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </div>
        <button type="submit" disabled={saving} className={`${primaryBtnCls} mt-2`} style={{ background: "var(--pg-terracotta)", boxShadow: "0 12px 28px -10px rgba(180,70,31,.7)" }}>
          {saving ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
