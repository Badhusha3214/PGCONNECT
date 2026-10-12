"use client";
import { LogoMark } from "../components/Logo";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDismissableOverlay } from "../../lib/useDismissableOverlay";
import {
  getAgentCode,
  getAgentStats,
  getAgentCommissions,
  requestAgentPayout,
} from "../api";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  paid: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-600 border border-red-200",
};

const propStatusStyles = {
  verified: "bg-green-50 text-green-700 border border-green-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  in_review: "bg-blue-50 text-blue-600 border border-blue-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
  unlisted: "bg-slate-100 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
};

const typeLabels = {
  bounty: "One-time bounty",
  recurring: "Recurring",
};

const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
const BarChartIcon = ({ className }) => <svg className={className} {...iconProps}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const HouseIcon = ({ className }) => <svg className={className} {...iconProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const WalletIcon = ({ className }) => <svg className={className} {...iconProps}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
const LinkIcon = ({ className }) => <svg className={className} {...iconProps}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const CheckCircleIcon = ({ className }) => <svg className={className} {...iconProps}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
const ClockIcon = ({ className }) => <svg className={className} {...iconProps}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

export default function AgentDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useDismissableOverlay(sidebarOpen, () => setSidebarOpen(false));

  const [agentCode, setAgentCode] = useState("");
  const [connectUrl, setConnectUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [stats, setStats] = useState(null);
  const [connectedProps, setConnectedProps] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const [commissions, setCommissions] = useState([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);

  const [payoutLoading, setPayoutLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const [codeRes, statsRes] = await Promise.all([getAgentCode(), getAgentStats()]);
      if (codeRes.success) {
        setAgentCode(codeRes.agent_code);
        setConnectUrl(codeRes.connect_url);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
        setConnectedProps(statsRes.connected_properties ?? []);
      }
    } catch (e) {
      console.error("Failed to load agent data:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadCommissions = useCallback(async () => {
    try {
      setCommissionsLoading(true);
      const res = await getAgentCommissions();
      if (res.success) setCommissions(res.commissions ?? []);
    } catch (e) { console.error(e); }
    finally { setCommissionsLoading(false); }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeNav === "Commissions") loadCommissions();
  }, [activeNav, loadCommissions]);

  const copyCode = () => {
    navigator.clipboard.writeText(connectUrl || agentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = async () => {
    try {
      setPayoutLoading(true);
      const res = await requestAgentPayout();
      alert(res.message);
      await loadStats();
    } catch (e) { alert(e.message); }
    finally { setPayoutLoading(false); }
  };

  const formatCurrency = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const formatDate = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const isVerified = stats?.is_verified_agent ?? false;

  const navItems = [
    { label: "Overview", Icon: BarChartIcon },
    { label: "Connected PGs", Icon: HouseIcon },
    { label: "Commissions", Icon: WalletIcon },
    { label: "Agent Code", Icon: LinkIcon },
  ];

  return (
    <>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">

        {/* TOP NAV */}
        <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-14 flex items-center px-4 sm:px-6 gap-4">
          <button className="lg:hidden p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 rounded-lg" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button onClick={() => router.push("/")} className="lg:block hidden cursor-pointer"><span className="inline-flex items-center gap-2"><LogoMark size={26} /><span className="display font-extrabold tracking-[-0.02em] text-[var(--pg-ink)]">PG Connect</span></span></button>
          <div className="lg:hidden">
            <p className="font-serif-display text-blue-600 text-base font-bold"><span className="inline-flex items-center gap-2"><LogoMark size={26} /><span className="display font-extrabold tracking-[-0.02em] text-[var(--pg-ink)]">PG Connect</span></span></p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">Agent Portal</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isVerified ? "Verified Agent" : "Pending Approval"}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">AG</div>
          </div>
        </header>

        <div className="flex flex-1">
          {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />}

          {/* SIDEBAR */}
          <aside ref={sidebarRef} className={`
            fixed inset-y-0 left-0 z-50 h-screen w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
            flex flex-col overflow-hidden transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            lg:!sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:self-start lg:z-30
          `}>
            <div className="hidden lg:block px-5 pt-6 pb-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Agent Dashboard</p>
            </div>
            <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <p className="font-bold text-blue-600 text-sm">Agent Dashboard</p>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="p-3 text-slate-500 dark:text-slate-400">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <button key={item.label}
                  onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left
                    ${activeNav === item.label ? "bg-blue-50 text-blue-600" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"}`}>
                  <item.Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => router.push("/")} className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer">
                ← Back to Home
              </button>
            </div>
          </aside>

          {/* MAIN */}
          <main id="main-content" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 min-w-0">

            {!statsLoading && !isVerified && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <span className="text-xl leading-none">⏳</span>
                <div>
                  <p className="text-sm font-bold text-amber-800">Your agent account is pending admin approval</p>
                  <p className="text-xs text-amber-700 mt-0.5">Your code is visible below, but it won't connect any properties until PG Connect approves your account.</p>
                </div>
              </div>
            )}

            {/* OVERVIEW */}
            {activeNav === "Overview" && (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Agent Overview</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track the PGs connected to your code and your commission earnings.</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Connected PGs", value: statsLoading ? "—" : stats?.total_connected ?? 0, Icon: HouseIcon },
                    { label: "Verified PGs", value: statsLoading ? "—" : stats?.verified_properties ?? 0, Icon: CheckCircleIcon },
                    { label: "Total Earned", value: statsLoading ? "—" : formatCurrency(stats?.total_commission_earned), Icon: WalletIcon },
                    { label: "Pending Balance", value: statsLoading ? "—" : formatCurrency(stats?.pending_balance), Icon: ClockIcon },
                  ].map((card) => (
                    <div key={card.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-blue-50 text-blue-600"><card.Icon className="w-5 h-5" /></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{card.label}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* How you earn */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-6">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">How You Earn</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Two ways commission lands in your balance.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">One-Time Bounty</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">A flat payout the moment a PG connected to your code gets verified by PG Connect.</p>
                    </div>
                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Recurring Commission</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">An ongoing cut of every rent payment made at your connected PGs, for as long as they stay active.</p>
                    </div>
                  </div>
                </div>

                {/* Payout section */}
                <div className="bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-500 rounded-full opacity-40" />
                  <div className="relative z-10">
                    <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-2">Available Balance</p>
                    <p className="text-4xl font-bold mb-4">{statsLoading ? "—" : formatCurrency(stats?.pending_balance)}</p>
                    <button
                      onClick={handleRequestPayout}
                      disabled={payoutLoading || (stats?.pending_balance ?? 0) < 100}
                      className="flex items-center gap-2 bg-white dark:bg-slate-800 text-blue-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      {payoutLoading ? "Processing..." : "Request Payout"}
                    </button>
                    <p className="text-blue-200 text-xs mt-3">Minimum payout is ₹100. Processed within 2-3 business days.</p>
                  </div>
                </div>
              </>
            )}

            {/* CONNECTED PGS */}
            {activeNav === "Connected PGs" && (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Connected PGs</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{connectedProps.length} total PGs connected to your code. This is a view-only list.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  {statsLoading ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
                  ) : connectedProps.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-3xl mb-3">🏠</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No PGs connected yet</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Share your agent code with PG owners to get started.</p>
                      <button onClick={() => setActiveNav("Agent Code")}
                        className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                        Get Your Agent Code →
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            {["PG Name", "City", "Status", "Verified"].map((h) => (
                              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-6 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {connectedProps.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/60 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.city || "—"}</td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${propStatusStyles[p.status] || propStatusStyles.pending}`}>
                                  {p.status?.replace("_", " ").toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {p.is_verified
                                  ? <span className="text-green-600 font-bold text-sm">✓</span>
                                  : <span className="text-slate-300 text-sm">—</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* COMMISSIONS */}
            {activeNav === "Commissions" && (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Commission History</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bounties and recurring commission from your connected PGs.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  {commissionsLoading ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading commissions...</div>
                  ) : commissions.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-3xl mb-3">💰</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No commissions yet</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Bounties post when a connected PG is verified; recurring commission posts when rent is paid.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            {["Property", "Month", "Amount", "Type", "Status", "Date"].map((h) => (
                              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-6 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {commissions.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/60 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{c.properties?.name ?? "—"}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {c.month ? new Date(c.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(c.amount)}</td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:text-slate-400">
                                  {typeLabels[c.type] || c.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusStyles[c.status] || statusStyles.pending}`}>
                                  {c.status?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(c.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* AGENT CODE */}
            {activeNav === "Agent Code" && (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Agent Code</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Give this code to PG owners. When they enter it while listing their property, it connects to you.</p>
                </div>

                {/* Code display */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Your Agent Code</p>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                      <p className="text-2xl font-bold text-blue-600 tracking-[0.3em] font-mono">{agentCode || "Loading..."}</p>
                    </div>
                    <button onClick={copyCode} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-all cursor-pointer shrink-0">
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Shareable Link</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 overflow-hidden">
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate font-mono">{connectUrl || "Loading..."}</p>
                    </div>
                    <button onClick={copyCode} className="border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 text-slate-700 dark:text-slate-300 font-semibold text-sm px-4 py-3 rounded-xl transition-all cursor-pointer shrink-0">
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>

                {/* How it works */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5">How Connecting Works</h3>
                  <div className="space-y-5">
                    {[
                      { n: 1, title: "Share your code", desc: "Send your unique agent code or link to a PG owner you've onboarded." },
                      { n: 2, title: "Owner lists their PG", desc: "The owner enters your code while listing their property. It's now connected to you." },
                      { n: 3, title: "Admin verifies the PG", desc: "PG Connect reviews and verifies the listing — you earn a one-time bounty the moment it goes live." },
                      { n: 4, title: "Tenants book and pay", desc: "Every rent payment made at that PG earns you an ongoing recurring commission." },
                    ].map((step) => (
                      <div key={step.n} className="flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{step.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="h-8" />
          </main>
        </div>
      </div>
    </>
  );
}
