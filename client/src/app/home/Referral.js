"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getCurrentUser, getReferralCode } from "../api";

// "Earn while you help" — design section. A logged-in student sees their real
// referral link; everyone else sees the design's placeholder and is sent to
// sign up. 2% matches the referrer rate applied in backend payments.ts.
export default function Referral() {
  const [link, setLink] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const me = await getCurrentUser();
        if (me?.user?.role !== "student") return;
        const res = await getReferralCode();
        if (mounted && res?.referral_url) { setLink(res.referral_url); setIsStudent(true); }
      } catch { /* stay on the placeholder */ }
    })();
    return () => { mounted = false; };
  }, []);

  const display = link ? link.replace(/^https?:\/\//, "") : "pgcon / r / your-code";

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — the text is still selectable */ }
  };

  const step = (bg, icon, label, extra = "") => (
    <div className="flex flex-col items-center gap-2 text-center flex-none w-[88px]">
      <span className={`w-14 h-14 rounded-[18px] grid place-items-center ${extra}`} style={{ background: bg }}>{icon}</span>
      <span className="text-[13px] font-bold">{label}</span>
    </div>
  );

  return (
    <section id="referral" className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-16">
      <div className="reveal bg-white rounded-[44px] grid gap-12 items-center" style={{ padding: "clamp(28px, 5vw, 64px)", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))" }}>
        <div className="flex flex-col gap-5">
          <span className="eyebrow">Earn while you help</span>
          <h2 className="display m-0 font-extrabold" style={{ fontSize: "clamp(36px, 4.2vw, 60px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
            Refer a PG owner, earn <span style={{ color: "#B4461F" }}>2% commission</span> every month.
          </h2>
          <p className="m-0 text-lg leading-relaxed text-[var(--pg-text-secondary)] max-w-[460px]">Share your unique link. Get paid when tenants pay rent.</p>
          <div className="flex flex-wrap gap-3">
            <Link href={isStudent ? "/referrerDashboard" : "/register"} className="btn-shine inline-flex items-center min-h-[52px] px-[26px] rounded-full font-bold text-base text-white no-underline" style={{ background: "#10231F" }}>
              Start Earning Now
            </Link>
          </div>
        </div>
        <div className="rounded-[32px] p-[26px] flex flex-col gap-6" style={{ background: "#F5F3EE" }}>
          <div className="flex flex-col gap-2.5">
            <label htmlFor="reflink" className="text-[13px] font-bold tracking-[.08em] uppercase" style={{ color: "#5B6762" }}>Your referral link</label>
            <div className="flex gap-2 bg-white rounded-[18px] py-1.5 pr-1.5 pl-4 items-center">
              <input id="reflink" readOnly value={display} className="mono flex-auto min-w-0 border-0 bg-transparent text-sm text-[#10231F] outline-none" />
              <button
                type="button"
                onClick={link ? copy : undefined}
                aria-disabled={!link}
                title={link ? "Copy link" : "Sign up as a student to get your link"}
                className="border-0 rounded-[14px] px-[18px] min-h-11 text-sm font-bold cursor-pointer text-white"
                style={{ background: copied ? "#1F6B4A" : "#B4461F" }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div aria-label="How referral earnings flow" role="img" className="flex items-center gap-2.5">
            {step("#10231F", <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>, "You share")}
            <div className="flow" aria-hidden="true"><span /></div>
            {step("#B4461F", <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21v-6h6v6" /></svg>, "Owner lists")}
            <div className="flow f2" aria-hidden="true"><span /></div>
            {step("#FFC447", <span className="font-extrabold text-lg" style={{ color: "#2A1C00" }}>2%</span>, "You earn monthly", "bed-free")}
          </div>
          <p className="m-0 text-[13px] leading-normal" style={{ color: "#5B6762" }}>
            Commission is paid on rent collected through PGCON. Full terms: <Link href="/how-it-works#referral">how referrals work</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
