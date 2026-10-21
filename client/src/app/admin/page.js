"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDismissableOverlay } from "../../lib/useDismissableOverlay";
import {
  getAdminStats,
  getVerificationQueue,
  verifyProperty,
  getAdminUsers,
  toggleUser,
  verifyAgent,
  getAdminReviews,
  moderateReview,
  getAdminProperties,
  getAdminPayments,
  getAdminCommissions,
  getCurrentUser,
  updateProfile,
  updatePassword,
  logout,
} from "../api";
import KycReview from "./KycReview";
import Toast, { useToast } from "../components/Toast";
import { LogoMark } from "../components/Logo";

const VERIFICATION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Enabled" },
  { value: "unlisted", label: "Disabled" },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { label: "Properties", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: "Users", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: "Agents", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg> },
  { label: "Verification", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { label: "Owner KYC", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="11" r="2.5" /><path d="M5.5 17c.6-1.8 2-2.8 3.5-2.8s2.9 1 3.5 2.8" /><line x1="15" y1="10" x2="19" y2="10" /><line x1="15" y1="14" x2="18" y2="14" /></svg> },
  { label: "Payments", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
  { label: "Reviews", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { label: "Settings", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

const PAYMENT_STATUS_STYLES = {
  paid: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  created: "bg-slate-50 text-slate-600 border-slate-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-blue-50 text-blue-700 border-blue-200",
};

const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
const PeopleIcon = ({ className }) => <svg className={className} {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const WarningIcon = ({ className }) => <svg className={className} {...iconProps}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const HouseIcon = ({ className }) => <svg className={className} {...iconProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

// Opens the listing exactly as students will see it, without counting a view.
function PreviewLink({ id }) {
  return (
    <a href={`/property/${id}?preview=1`} target="_blank" rel="noopener noreferrer"
      className="text-[11px] font-bold no-underline" style={{ color: "var(--pg-terracotta)" }}>
      Preview ↗
    </a>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: { background: "#fff7ed", color: "var(--pg-accent)", border: "1px solid #fed7aa" },
    verified: { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" },
    unlisted: { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" },
  };
  const labels = { pending: "NEW", verified: "ENABLED", unlisted: "DISABLED" };
  return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={styles[status] || styles.pending}>
      {labels[status] || status?.toUpperCase()}
    </span>
  );
}

export default function AdminPanel() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useDismissableOverlay(sidebarOpen, () => setSidebarOpen(false));
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueTotal, setQueueTotal] = useState(0);
  const [actioningId, setActioningId] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersTotal, setUsersTotal] = useState(0);

  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsTotal, setAgentsTotal] = useState(0);
  const [agentActioningId, setAgentActioningId] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [moderatingId, setModeratingId] = useState(null);

  const [allProperties, setAllProperties] = useState([]);
  const [allPropertiesLoading, setAllPropertiesLoading] = useState(false);
  const [allPropertiesTotal, setAllPropertiesTotal] = useState(0);
  const [propertiesSort, setPropertiesSort] = useState("views");

  const [verificationQueue, setVerificationQueue] = useState([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationTotal, setVerificationTotal] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [verificationActioningId, setVerificationActioningId] = useState(null);

  const [paymentsView, setPaymentsView] = useState("transactions");
  const [payments, setPayments] = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [commissionsTotal, setCommissionsTotal] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [settingsUser, setSettingsUser] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ new_password: "", confirm_password: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setStatsLoading(true);
      const s = await getAdminStats();
      if (s.success) setStats(s.stats);
    } catch (e) { console.error("Stats error:", e); }
    finally { setStatsLoading(false); }

    try {
      setQueueLoading(true);
      const q = await getVerificationQueue("pending");
      if (q.success) { setQueue(q.properties); setQueueTotal(q.total); }
    } catch (e) { console.error("Queue error:", e); }
    finally { setQueueLoading(false); }

    try {
      const r = await getAdminReviews("pending");
      if (r.success) setReviewsTotal(r.total);
    } catch (e) { console.error("Reviews count error:", e); }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const u = await getAdminUsers();
      if (u.success) { setUsers(u.users); setUsersTotal(u.total); }
    } catch (e) { console.error("Users error:", e); }
    finally { setUsersLoading(false); }
  };

  const loadAgents = async () => {
    try {
      setAgentsLoading(true);
      const a = await getAdminUsers({ role: "agent" });
      if (a.success) { setAgents(a.users); setAgentsTotal(a.total); }
    } catch (e) { console.error("Agents error:", e); }
    finally { setAgentsLoading(false); }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const r = await getAdminReviews("pending");
      if (r.success) { setReviews(r.reviews); setReviewsTotal(r.total); }
    } catch (e) { console.error("Reviews error:", e); }
    finally { setReviewsLoading(false); }
  };

  const loadAllProperties = async (sort = propertiesSort) => {
    try {
      setAllPropertiesLoading(true);
      const p = await getAdminProperties(sort);
      if (p.success) { setAllProperties(p.properties); setAllPropertiesTotal(p.total); }
    } catch (e) { console.error("Properties error:", e); }
    finally { setAllPropertiesLoading(false); }
  };

  const loadVerificationQueue = async (status = verificationStatus) => {
    try {
      setVerificationLoading(true);
      const q = await getVerificationQueue(status);
      if (q.success) { setVerificationQueue(q.properties); setVerificationTotal(q.total); }
    } catch (e) { console.error("Verification error:", e); }
    finally { setVerificationLoading(false); }
  };

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      const [p, c] = await Promise.all([getAdminPayments(), getAdminCommissions()]);
      if (p.success) { setPayments(p.payments); setPaymentsTotal(p.total); setPaymentsSummary(p.summary); }
      if (c.success) { setCommissions(c.commissions); setCommissionsTotal(c.total); }
    } catch (e) { console.error("Payments error:", e); }
    finally { setPaymentsLoading(false); }
  };

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await getCurrentUser();
      if (res.success) {
        setSettingsUser(res.user);
        setSettingsForm({
          first_name: res.user.first_name || "",
          last_name: res.user.last_name || "",
          phone: res.user.phone || "",
        });
      }
    } catch (e) { console.error("Settings error:", e); }
    finally { setSettingsLoading(false); }
  };

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeNav === "Users") loadUsers();
    if (activeNav === "Agents") loadAgents();
    if (activeNav === "Reviews") loadReviews();
    if (activeNav === "Properties") loadAllProperties();
    if (activeNav === "Verification") loadVerificationQueue();
    if (activeNav === "Payments") loadPayments();
    if (activeNav === "Settings") loadSettings();
  }, [activeNav]);

  const handlePropertiesSortChange = (sort) => {
    setPropertiesSort(sort);
    loadAllProperties(sort);
  };

  const handleVerificationStatusChange = (status) => {
    setVerificationStatus(status);
    loadVerificationQueue(status);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Brief confirmation after an admin action, plus a fresh stats read so the
  // "Pending Verifications" card doesn't go stale.
  const [toast, showToast] = useToast();
  const afterVerify = (res, action) => {
    showToast(res?.message || (action === "enable" ? "Property enabled" : "Property disabled"));
    getAdminStats().then((s) => { if (s.success) setStats(s.stats); }).catch(() => {});
  };
  const showError = (what, e) => showToast(`Couldn't ${what}: ${e?.message || "please try again."}`, "error");

  const handleVerify = async (propertyId, action) => {
    try {
      setActioningId(propertyId);
      const res = await verifyProperty(propertyId, action);
      setQueue((prev) => prev.filter((p) => p.id !== propertyId));
      setQueueTotal((t) => t - 1);
      afterVerify(res, action);
    } catch (e) {
      showError(action === "enable" ? "enable the property" : "disable the property", e);
    } finally {
      setActioningId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await toggleUser(userId);
      if (res.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !u.is_active } : u));
        showToast(res.message || "User updated");
      }
    } catch (e) { showError("update the user", e); }
  };

  const handleVerifyAgent = async (agentId, action) => {
    try {
      setAgentActioningId(agentId);
      const res = await verifyAgent(agentId, action);
      if (res.success) {
        setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, is_verified_agent: action === "verify" } : a));
        showToast(action === "verify" ? "Agent approved — their code is now active." : "Agent access revoked.");
      }
    } catch (e) {
      showError(action === "verify" ? "approve the agent" : "update the agent", e);
    } finally {
      setAgentActioningId(null);
    }
  };

  const handleModerateReview = async (reviewId, action) => {
    try {
      setModeratingId(reviewId);
      await moderateReview(reviewId, action);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewsTotal((t) => t - 1);
      showToast(action === "approve" ? "Review published." : "Review rejected.");
    } catch (e) {
      showError("moderate the review", e);
    } finally {
      setModeratingId(null);
    }
  };

  const handleVerificationAction = async (propertyId, action) => {
    try {
      setVerificationActioningId(propertyId);
      const res = await verifyProperty(propertyId, action);
      setVerificationQueue((prev) => prev.filter((p) => p.id !== propertyId));
      setVerificationTotal((t) => Math.max(0, t - 1));
      afterVerify(res, action);
      // The Dashboard's queue always shows "pending" — keep it in sync if that's what's showing here too.
      if (verificationStatus === "pending") {
        setQueue((prev) => prev.filter((p) => p.id !== propertyId));
        setQueueTotal((t) => Math.max(0, t - 1));
      }
    } catch (e) {
      showError(action === "enable" ? "enable the property" : "disable the property", e);
    } finally {
      setVerificationActioningId(null);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage("");
    try {
      const res = await updateProfile(settingsForm);
      if (res.success) setSettingsMessage("Profile updated.");
    } catch (e) {
      setSettingsMessage(`Failed: ${e.message}`);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage("Passwords don't match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword({ new_password: passwordForm.new_password });
      setPasswordMessage("Password updated.");
      setPasswordForm({ new_password: "", confirm_password: "" });
    } catch (e) {
      setPasswordMessage(`Failed: ${e.message}`);
    } finally {
      setPasswordSaving(false);
    }
  };

  const formatCurrency = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  return (
    <>

      <div className="min-h-screen flex flex-col" style={{ background: "var(--pg-bg)", color: "var(--pg-text)" }}>

        {/* TOP HEADER */}
        <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-blue-100 shadow-sm h-14 flex items-center px-4 sm:px-5 gap-3">
          <button className="lg:hidden p-3 rounded-lg" aria-label="Open menu" style={{ color: "var(--pg-text-tertiary)" }} onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="lg:hidden">
            <p className="font-bold text-sm" style={{ color: "var(--pg-primary)" }}>PGCON Admin</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg cursor-pointer" style={{ color: "var(--pg-text-tertiary)" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {(queueTotal > 0 || reviewsTotal > 0) && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"/>}
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold leading-tight" style={{ color: "var(--pg-primary)" }}>
                {settingsUser ? `${settingsUser.first_name} ${settingsUser.last_name}` : "PGCON Admin"}
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer"
                style={{ background: "var(--pg-primary)" }}
              >
                {settingsUser ? `${settingsUser.first_name?.[0] || ""}${settingsUser.last_name?.[0] || ""}`.toUpperCase() || "AD" : "AD"}
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-blue-100 py-1.5 z-50">
                    <p className="px-3.5 py-2 text-xs text-[var(--pg-text-secondary)] truncate border-b border-blue-50">
                      {settingsUser?.email || "Loading..."}
                    </p>
                    <button
                      onClick={() => { setActiveNav("Settings"); setUserMenuOpen(false); }}
                      className="w-full text-left px-3.5 py-2 text-sm text-[var(--pg-text)] hover:bg-blue-50 cursor-pointer"
                    >
                      Account Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />}

          {/* SIDEBAR */}
          <aside ref={sidebarRef} className={`
            fixed lg:sticky top-0 lg:top-14 z-50 lg:z-auto
            h-screen lg:h-[calc(100vh-56px)]
            w-56 bg-white dark:bg-slate-800 border-r border-blue-100
            flex flex-col sidebar-scroll overflow-y-auto
            transition-transform duration-250
            ${sidebarOpen ? "translate-x-0 slide-in" : "-translate-x-full lg:translate-x-0"}
          `}>
            <div className="hidden lg:block px-5 pt-5 pb-4 border-b border-blue-50">
              <p className="font-bold text-sm" style={{ color: "var(--pg-primary)" }}><span className="inline-flex items-center gap-2"><LogoMark size={26} /><span className="display font-extrabold tracking-[-0.02em] text-[var(--pg-ink)]">PGCON</span></span></p>
              <p className="text-[9px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: "var(--pg-text-tertiary)" }}>Admin Portal</p>
            </div>
            <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-4 border-b border-blue-50">
              <p className="font-bold text-sm" style={{ color: "var(--pg-primary)" }}>PGCON Admin</p>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="p-3 cursor-pointer" style={{ color: "var(--pg-text-tertiary)" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <button key={item.label}
                  onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left"
                  style={activeNav === item.label ? { background: "var(--pg-chip-bg)", color: "var(--pg-primary)" } : { color: "var(--pg-text-secondary)" }}>
                  <span style={activeNav === item.label ? { color: "var(--pg-primary)" } : { color: "var(--pg-text-tertiary)" }}>{item.icon}</span>
                  {item.label}
                  {item.label === "Verification" && queueTotal > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{queueTotal}</span>
                  )}
                  {item.label === "Reviews" && reviewsTotal > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{reviewsTotal}</span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* MAIN */}
          <main id="main-content" className="flex-1 overflow-y-auto min-w-0">
            <Toast toast={toast} onClose={() => showToast(null)} />
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1200px]">

              {/* Page title */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--pg-text)" }}>Platform Overview</h1>
                  <p className="text-sm mt-1" style={{ color: "var(--pg-text-secondary)" }}>Real-time metrics for PGCON.</p>
                </div>
                <button onClick={handleRefresh}
                  className="flex items-center gap-2 active:scale-[0.98] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0" style={{ background: "var(--pg-primary)" }}>
                  <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                  </svg>
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              {/* STAT CARDS */}
              {activeNav === "Dashboard" && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
                    {[
                      { label: "Platform Revenue", value: formatCurrency(stats?.totalRevenue), badge: null, iconChar: "₹", color: "blue" },
                      { label: "Total Active Users", value: statsLoading ? "—" : stats?.totalUsers ?? 0, badge: `${stats?.studentCount ?? 0}S / ${stats?.ownerCount ?? 0}O / ${stats?.agentCount ?? 0}A`, Icon: PeopleIcon, color: "green" },
                      { label: "Pending Verifications", value: statsLoading ? "—" : stats?.pendingVerifications ?? 0, badge: "Urgent", Icon: WarningIcon, color: "red" },
                      { label: "Active Listings", value: statsLoading ? "—" : stats?.activeListings ?? 0, badge: null, Icon: HouseIcon, color: "slate" },
                    ].map((card, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 hover:shadow-sm transition-shadow border" style={{ borderColor: "var(--pg-border-soft)" }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: "var(--pg-bg)", color: "var(--pg-primary)" }}>
                            {card.iconChar || <card.Icon className="w-5 h-5" />}
                          </div>
                          {card.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={card.color === 'red' ? { background: "var(--pg-accent)", color: "white" } : { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>{card.badge}</span>}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--pg-text-secondary)" }}>{card.label}</p>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--pg-text)" }}>
                          {statsLoading ? "—" : card.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Verification Queue */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 border" style={{ borderColor: "var(--pg-border-soft)" }}>
                    <div className="px-5 sm:px-6 py-4 border-b border-blue-50">
                      <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>Property Verification Queue</h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>Review newly submitted properties.</p>
                    </div>

                    {queueLoading ? (
                      <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading queue...</div>
                    ) : queue.length === 0 ? (
                      <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        All caught up! No pending verifications.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              {["Property", "Owner", "City", "Submitted", "Status", "Action"].map((h) => (
                                <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-5 py-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {queue.map((p) => (
                              <tr key={p.id} className="hover:bg-[var(--pg-bg)]/60 transition-colors">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    {p.property_images?.[0]?.image_url && (
                                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--pg-bg)] shrink-0">
                                        <img src={p.property_images[0].image_url} alt={p.name} className="w-full h-full object-cover"/>
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <span className="block text-sm font-semibold text-[var(--pg-text)]">{p.name}</span>
                                      <PreviewLink id={p.id} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                                  {p.owner?.first_name} {p.owner?.last_name}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{p.city}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                                  {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td className="px-5 py-3.5"><StatusBadge status={p.status}/></td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleVerify(p.id, "enable")}
                                      disabled={actioningId === p.id}
                                      className="text-xs font-bold cursor-pointer disabled:opacity-50" style={{ color: "var(--pg-primary)" }}>
                                      Enable
                                    </button>
                                    <span className="text-slate-200">|</span>
                                    <button
                                      onClick={() => handleVerify(p.id, "disable")}
                                      disabled={actioningId === p.id}
                                      className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50">
                                      Disable
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {queueTotal > queue.length && (
                      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Showing {queue.length} of {queueTotal} pending</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* USERS TAB */}
              {activeNav === "Owner KYC" && <KycReview />}

              {activeNav === "Users" && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--pg-border-soft)" }}>
                  <div className="px-5 sm:px-6 py-4 border-b border-blue-50">
                    <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>All Users ({usersTotal})</h2>
                  </div>
                  {usersLoading ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading users...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            {["Name", "Role", "University / Phone", "Status", "Joined", "Action"].map((h) => (
                              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-5 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-[var(--pg-bg)]/60 transition-colors">
                              <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--pg-text)" }}>{u.first_name} {u.last_name}</td>
                              <td className="px-5 py-3.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                  style={u.role === 'admin' ? { background: "#f3e8ff", color: "#7c3aed", borderColor: "#e9d5ff" } : u.role === 'owner' ? { background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" } : { background: "var(--pg-chip-bg)", color: "var(--pg-primary)", borderColor: "var(--pg-border)" }}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{u.university || u.phone || "—"}</td>
                              <td className="px-5 py-3.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                  {u.is_active ? "ACTIVE" : "DISABLED"}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                                {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="px-5 py-3.5">
                                <button onClick={() => handleToggleUser(u.id)}
                                  className={`text-xs font-bold cursor-pointer ${u.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}>
                                  {u.is_active ? "Disable" : "Activate"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* AGENTS TAB */}
              {activeNav === "Agents" && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--pg-border-soft)" }}>
                  <div className="px-5 sm:px-6 py-4 border-b border-blue-50">
                    <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>Onboarding Agents ({agentsTotal})</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>Approve agents before their code can connect owner listings.</p>
                  </div>
                  {agentsLoading ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading agents...</div>
                  ) : agents.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">No agents have registered yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            {["Name", "Agent Code", "Phone", "Status", "Joined", "Action"].map((h) => (
                              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-5 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {agents.map((a) => (
                            <tr key={a.id} className="hover:bg-[var(--pg-bg)]/60 transition-colors">
                              <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--pg-text)" }}>{a.first_name} {a.last_name}</td>
                              <td className="px-5 py-3.5 text-sm font-mono tracking-wider text-slate-500 dark:text-slate-400">{a.agent_code || "—"}</td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{a.phone || "—"}</td>
                              <td className="px-5 py-3.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.is_verified_agent ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                  {a.is_verified_agent ? "APPROVED" : "PENDING"}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                                {new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="px-5 py-3.5">
                                <button
                                  onClick={() => handleVerifyAgent(a.id, a.is_verified_agent ? "unverify" : "verify")}
                                  disabled={agentActioningId === a.id}
                                  className={`text-xs font-bold cursor-pointer disabled:opacity-50 ${a.is_verified_agent ? 'text-red-500 hover:text-red-600' : 'text-blue-600 hover:text-blue-700'}`}
                                  style={a.is_verified_agent ? {} : { color: "var(--pg-primary)" }}>
                                  {a.is_verified_agent ? "Revoke" : "Approve"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENTS TAB */}
              {activeNav === "Payments" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { label: "Platform Revenue", value: paymentsSummary?.platform_revenue },
                      { label: "Owner Payouts", value: paymentsSummary?.owner_payouts },
                      { label: "Referrer Commissions", value: paymentsSummary?.referrer_commissions },
                      { label: "Agent Commissions", value: paymentsSummary?.agent_commissions },
                    ].map((card) => (
                      <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border" style={{ borderColor: "var(--pg-border-soft)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{card.label}</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: "var(--pg-text)" }}>
                          {paymentsLoading && !paymentsSummary ? "—" : formatCurrency(card.value ?? 0)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--pg-border-soft)" }}>
                    <div className="px-5 sm:px-6 py-4 border-b border-blue-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>
                          {paymentsView === "transactions" ? `Transactions (${paymentsTotal})` : `Commissions (${commissionsTotal})`}
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>Totals above count paid transactions only.</p>
                      </div>
                      <div className="flex gap-2" role="group" aria-label="Ledger view">
                        {[{ value: "transactions", label: "Transactions" }, { value: "commissions", label: "Commissions" }].map((v) => (
                          <button
                            key={v.value}
                            onClick={() => setPaymentsView(v.value)}
                            aria-pressed={paymentsView === v.value}
                            className="text-xs font-bold px-3 py-2 min-h-[44px] sm:min-h-0 rounded-lg cursor-pointer transition-colors"
                            style={paymentsView === v.value ? { background: "var(--pg-chip-bg)", color: "var(--pg-primary)" } : { color: "var(--pg-text-secondary)" }}>
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {paymentsLoading ? (
                      <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading payments...</div>
                    ) : paymentsView === "transactions" ? (
                      payments.length === 0 ? (
                        <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">No transactions yet.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800">
                                {["Tenant", "Property", "Month", "Amount", "Platform Fee", "Owner Payout", "Status", "Date"].map((h) => (
                                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-5 py-3 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {payments.map((p) => (
                                <tr key={p.id} className="hover:bg-[var(--pg-bg)]/60 transition-colors">
                                  <td className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap" style={{ color: "var(--pg-text)" }}>{p.tenant ? `${p.tenant.first_name} ${p.tenant.last_name}` : "—"}</td>
                                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.properties?.name || "—"}</td>
                                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {p.month ? new Date(p.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                                  </td>
                                  <td className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap" style={{ color: "var(--pg-text)" }}>{formatCurrency(p.amount)}</td>
                                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatCurrency(p.platform_fee)}</td>
                                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatCurrency(p.owner_payout)}</td>
                                  <td className="px-5 py-3.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_STYLES[p.status] || PAYMENT_STATUS_STYLES.created}`}>
                                      {p.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : commissions.length === 0 ? (
                      <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">No commissions yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              {["Earner", "Role", "Type", "Property", "Amount", "Status", "Date"].map((h) => (
                                <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-5 py-3 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {commissions.map((c) => (
                              <tr key={c.id} className="hover:bg-[var(--pg-bg)]/60 transition-colors">
                                <td className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap" style={{ color: "var(--pg-text)" }}>{c.referrer ? `${c.referrer.first_name} ${c.referrer.last_name}` : "—"}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 capitalize">{c.role}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 capitalize">{c.type}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.properties?.name || "—"}</td>
                                <td className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap" style={{ color: "var(--pg-text)" }}>{formatCurrency(c.amount)}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_STYLES[c.status] || PAYMENT_STATUS_STYLES.created}`}>
                                    {c.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                  {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* REVIEWS TAB */}
              {activeNav === "Reviews" && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--pg-border-soft)" }}>
                  <div className="px-5 sm:px-6 py-4 border-b border-blue-50">
                    <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>Pending Reviews ({reviewsTotal})</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>Approve or reject tenant reviews before they go live.</p>
                  </div>
                  {reviewsLoading ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading reviews...</div>
                  ) : reviews.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      No pending reviews.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {reviews.map((r) => (
                        <div key={r.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-sm font-semibold" style={{ color: "var(--pg-text)" }}>{r.property?.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">— {r.property?.city}</span>
                              {r.is_verified_stay && (
                                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">Verified Stay</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} style={{ color: s <= r.rating ? "var(--pg-accent)" : "#e2e8f0" }}>★</span>
                              ))}
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">by {r.tenant?.first_name} {r.tenant?.last_name}</span>
                            </div>
                            {r.comment && <p className="text-sm text-slate-600 dark:text-slate-400">{r.comment}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleModerateReview(r.id, "approve")}
                              disabled={moderatingId === r.id}
                              className="text-xs font-bold cursor-pointer disabled:opacity-50" style={{ color: "var(--pg-primary)" }}>
                              Approve
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => handleModerateReview(r.id, "reject")}
                              disabled={moderatingId === r.id}
                              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50">
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PROPERTIES TAB */}
              {activeNav === "Properties" && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--pg-border-soft)" }}>
                  <div className="px-5 sm:px-6 py-4 border-b border-blue-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>All Properties ({allPropertiesTotal})</h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>How many people have viewed and liked each listing.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push("/listProperty")}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-sm font-semibold cursor-pointer whitespace-nowrap"
                      >
                        + Onboard a PG
                      </button>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Sort by</span>
                      <select
                        value={propertiesSort}
                        onChange={(e) => handlePropertiesSortChange(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-400 cursor-pointer"
                      >
                        <option value="views">Most Viewed</option>
                        <option value="saves">Most Liked</option>
                        <option value="inquiries">Most Inquiries</option>
                        <option value="newest">Newest</option>
                      </select>
                    </div>
                  </div>
                  {allPropertiesLoading ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading properties...</div>
                  ) : allProperties.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">No properties yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            {["Property", "Owner", "City", "Status", "Views", "Likes", "Inquiries"].map((h) => (
                              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-5 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {allProperties.map((p) => (
                            <tr key={p.id} className="hover:bg-[var(--pg-bg)]/60 transition-colors">
                              <td className="px-5 py-3.5 text-sm font-semibold text-[var(--pg-text)]">{p.name}</td>
                              <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{p.owner?.first_name} {p.owner?.last_name}</td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{p.city}</td>
                              <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pg-text)]">
                                  <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                  {p.views ?? 0}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pg-text)]">
                                  <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                  {p.saves_count ?? 0}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{p.inquiries_count ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* VERIFICATION TAB */}
              {activeNav === "Verification" && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--pg-border-soft)" }}>
                  <div className="px-5 sm:px-6 py-4 border-b border-blue-50">
                    <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>Property Verification ({verificationTotal})</h2>
                    <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--pg-text-secondary)" }}>Review submitted properties by status.</p>
                    <div className="flex flex-wrap gap-2">
                      {VERIFICATION_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => handleVerificationStatusChange(s.value)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer"
                          style={verificationStatus === s.value ? { background: "var(--pg-primary)", color: "white", borderColor: "var(--pg-primary)" } : { background: "var(--pg-surface)", color: "var(--pg-text-secondary)", borderColor: "var(--pg-border)" }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {verificationLoading ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
                  ) : verificationQueue.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      No properties with this status.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            {["Property", "Owner", "City", "Submitted", "Status", "Action"].map((h) => (
                              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-5 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {verificationQueue.map((p) => (
                            <tr key={p.id} className="hover:bg-[var(--pg-bg)]/60 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  {p.property_images?.[0]?.image_url && (
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--pg-bg)] shrink-0">
                                      <img src={p.property_images[0].image_url} alt={p.name} className="w-full h-full object-cover"/>
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <span className="block text-sm font-semibold text-[var(--pg-text)]">{p.name}</span>
                                    <PreviewLink id={p.id} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                                {p.owner?.first_name} {p.owner?.last_name}
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{p.city}</td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                                {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="px-5 py-3.5"><StatusBadge status={p.status}/></td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleVerificationAction(p.id, "enable")}
                                    disabled={verificationActioningId === p.id}
                                    className="text-xs font-bold cursor-pointer disabled:opacity-50" style={{ color: "var(--pg-primary)" }}>
                                    Enable
                                  </button>
                                  <span className="text-slate-200">|</span>
                                  <button
                                    onClick={() => handleVerificationAction(p.id, "disable")}
                                    disabled={verificationActioningId === p.id}
                                    className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50">
                                    Disable
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeNav === "Settings" && (
                <div className="space-y-6 max-w-xl">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--pg-border-soft)" }}>
                    <div className="px-5 sm:px-6 py-4 border-b border-blue-50">
                      <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>Admin Account</h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--pg-text-secondary)" }}>{settingsUser?.email}</p>
                    </div>
                    {settingsLoading ? (
                      <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
                    ) : (
                      <form onSubmit={handleSettingsSave} className="px-5 sm:px-6 py-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">First Name</label>
                            <input
                              type="text"
                              value={settingsForm.first_name}
                              onChange={(e) => setSettingsForm((f) => ({ ...f, first_name: e.target.value }))}
                              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                              style={{ borderColor: "var(--pg-border)" }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Last Name</label>
                            <input
                              type="text"
                              value={settingsForm.last_name}
                              onChange={(e) => setSettingsForm((f) => ({ ...f, last_name: e.target.value }))}
                              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                              style={{ borderColor: "var(--pg-border)" }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Phone</label>
                          <input
                            type="tel"
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm((f) => ({ ...f, phone: e.target.value }))}
                            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                            style={{ borderColor: "var(--pg-border)" }}
                          />
                        </div>
                        {settingsMessage && <p className="text-xs" style={{ color: settingsMessage.startsWith("Failed") ? "#dc2626" : "#15803d" }}>{settingsMessage}</p>}
                        <button
                          type="submit"
                          disabled={settingsSaving}
                          className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white cursor-pointer disabled:opacity-60"
                          style={{ background: "var(--pg-primary)" }}
                        >
                          {settingsSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--pg-border-soft)" }}>
                    <div className="px-5 sm:px-6 py-4 border-b border-blue-50">
                      <h2 className="text-base font-bold" style={{ color: "var(--pg-text)" }}>Change Password</h2>
                    </div>
                    <form onSubmit={handlePasswordSave} className="px-5 sm:px-6 py-5 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">New Password</label>
                        <input
                          type="password"
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                          style={{ borderColor: "var(--pg-border)" }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))}
                          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                          style={{ borderColor: "var(--pg-border)" }}
                        />
                      </div>
                      {passwordMessage && <p className="text-xs" style={{ color: passwordMessage.startsWith("Failed") || passwordMessage.includes("match") || passwordMessage.includes("must be") ? "#dc2626" : "#15803d" }}>{passwordMessage}</p>}
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white cursor-pointer disabled:opacity-60"
                        style={{ background: "var(--pg-primary)" }}
                      >
                        {passwordSaving ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-5 mt-8 flex items-center justify-between" style={{ borderColor: "var(--pg-border-soft)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--pg-primary)" }}><span className="inline-flex items-center gap-2"><LogoMark size={26} /><span className="display font-extrabold tracking-[-0.02em] text-[var(--pg-ink)]">PGCON</span></span></p>
                <p className="text-xs" style={{ color: "var(--pg-text-tertiary)" }}>&copy; {new Date().getFullYear()} PGCON.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
