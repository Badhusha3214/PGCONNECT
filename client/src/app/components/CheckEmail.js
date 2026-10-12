"use client";
import { useEffect, useState } from "react";
import { resendConfirmation } from "../api";

const COOLDOWN_SECONDS = 60;

// "Confirm your email" instructions + resend button. Used after registering
// and when someone tries to log in before confirming.
export default function CheckEmail({ email, role, compact = false }) {
  const [cooldown, setCooldown] = useState(compact ? 0 : COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setError("");
    setNotice("");
    setSending(true);
    try {
      await resendConfirmation(email);
      setNotice(`A new confirmation link has been sent to ${email}.`);
      setCooldown(COOLDOWN_SECONDS);
    } catch (e) {
      setError(e.message || "Could not send the email. Try again in a minute.");
    } finally {
      setSending(false);
    }
  };

  const afterConfirm =
    role === "agent"
      ? "After confirming, log in. Your agent code becomes active once an admin approves your account."
      : role === "owner"
        ? "After confirming, log in and list your PG from the Owner Dashboard."
        : "After confirming, log in and start finding your bed.";

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[24px] p-5 flex gap-4 items-start" style={{ background: "var(--pg-forest)", color: "#F5F3EE" }}>
        <span className="bed-free shrink-0 w-12 h-12 rounded-2xl grid place-items-center" style={{ background: "#FFD27A" }} aria-hidden="true">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#2A1C00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
        </span>
        <div className="min-w-0">
          <p className="m-0 font-bold text-base">{compact ? "Confirm your email to log in" : "Check your email"}</p>
          <p className="m-0 mt-1 text-sm" style={{ color: "rgba(245,243,238,.8)", lineHeight: 1.55 }}>
            We sent a confirmation link to <strong className="break-all" style={{ color: "#FFD27A" }}>{email}</strong>. Open it and tap <strong>Confirm your email</strong>.
          </p>
        </div>
      </div>

      <ol className="m-0 pl-5 flex flex-col gap-1.5 text-sm text-[var(--pg-text-secondary)]" style={{ lineHeight: 1.55 }}>
        <li>Open your inbox for <strong className="text-[var(--pg-ink)]">{email}</strong>.</li>
        <li>Find the email from PG Connect and tap the confirm button.</li>
        <li>{afterConfirm}</li>
      </ol>

      <div className="rounded-[20px] bg-white p-4 text-sm text-[var(--pg-text-secondary)]" style={{ boxShadow: "var(--pg-shadow-card)", lineHeight: 1.55 }}>
        <p className="m-0 mb-2 font-bold text-[var(--pg-ink)]">Can&apos;t find the email?</p>
        <ul className="m-0 pl-5 flex flex-col gap-1.5">
          <li>It can take a minute or two to arrive.</li>
          <li>Check <strong>Spam / Junk</strong>, and in Gmail the <strong>Promotions</strong> and <strong>Updates</strong> tabs. If it&apos;s there, mark it &ldquo;Not spam&rdquo;.</li>
          <li>Search your mailbox for <strong>&ldquo;Confirm your email&rdquo;</strong> or <strong>&ldquo;PG Connect&rdquo;</strong>.</li>
          <li>Typo in the address? <a href="/register" className="font-bold">Register again</a> with the correct email.</li>
          <li>Link says expired or already used? Request a new one below — only the newest link works.</li>
        </ul>
      </div>

      {notice && <div role="status" className="text-sm font-medium px-4 py-3 rounded-2xl" style={{ background: "var(--pg-success-bg)", color: "var(--pg-success)" }}>{notice}</div>}
      {error && <div role="alert" className="text-sm font-medium px-4 py-3 rounded-2xl" style={{ background: "var(--pg-danger-bg)", color: "var(--pg-danger)" }}>{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={resend}
          disabled={sending || cooldown > 0}
          className="flex-1 min-h-[48px] rounded-full border-[1.5px] border-[var(--pg-ink)] text-[var(--pg-ink)] font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--pg-ink)] hover:text-white transition-colors"
        >
          {sending ? "Sending…" : cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend confirmation email"}
        </button>
        {!compact && (
          <a href="/signin" className="flex-1 min-h-[48px] rounded-full grid place-items-center text-white font-bold text-sm no-underline" style={{ background: "var(--pg-terracotta)" }}>
            I&apos;ve confirmed — Log in
          </a>
        )}
      </div>
    </div>
  );
}
