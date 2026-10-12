"use client";
import { useEffect, useState } from "react";
import { getKycQueue, reviewKycDocument, openKycDocument } from "../api";

const LABELS = {
  aadhaar: "Aadhaar card",
  pan: "PAN card",
  driving_license: "Driving licence",
  passport: "Passport",
  property_proof: "Property proof",
};
const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const formatDate = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function KycReview() {
  const [status, setStatus] = useState("pending");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null); // doc id whose reason box is open
  const [reason, setReason] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    getKycQueue(status)
      .then((res) => { if (mounted) setDocs(res.documents ?? []); })
      .catch((e) => { if (mounted) setError(e.message || "Couldn't load documents"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [status]);

  const review = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      await reviewKycDocument(id, action, action === "reject" ? reason : undefined);
      setDocs((d) => d.filter((x) => x.id !== id));
      setRejecting(null);
      setReason("");
    } catch (e) {
      setError(e.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--pg-text)]">Owner KYC</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Approving an ID document marks the owner as a verified owner.</p>
        </div>
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
              style={status === t.value
                ? { background: "var(--pg-primary)", color: "white", borderColor: "var(--pg-primary)" }
                : { background: "var(--pg-surface)", color: "var(--pg-text-secondary)", borderColor: "var(--pg-border)" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="px-5 sm:px-6 pt-4 text-xs font-medium text-red-600">{error}</p>}

      {loading ? (
        <p className="px-5 sm:px-6 py-6 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="px-5 sm:px-6 py-6 text-sm text-slate-500 dark:text-slate-400">No {status} documents.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {docs.map((d) => {
            const owner = d.owner ?? {};
            return (
              <li key={d.id} className="px-5 sm:px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--pg-text)]">
                      {[owner.first_name, owner.last_name].filter(Boolean).join(" ") || "Owner"}
                      {owner.is_verified_owner && <span className="ml-2 text-[10px] font-bold text-green-700">✓ verified</span>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {LABELS[d.doc_type] ?? d.doc_type} · {d.file_name} · {formatDate(d.created_at)}
                      {owner.phone ? ` · ${owner.phone}` : ""}
                    </p>
                    {d.status === "rejected" && d.rejection_reason && (
                      <p className="text-xs text-red-600 mt-0.5">Reason: {d.rejection_reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => openKycDocument(d.id).catch(() => setError("Couldn't open the document"))}
                    className="text-xs font-semibold text-[var(--pg-primary)] cursor-pointer hover:underline"
                  >
                    View file
                  </button>
                  {d.status === "pending" && (
                    <>
                      <button
                        onClick={() => review(d.id, "approve")}
                        disabled={busyId === d.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white cursor-pointer disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => { setRejecting(rejecting === d.id ? null : d.id); setReason(""); }}
                        disabled={busyId === d.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
                {rejecting === d.id && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason shown to the owner, e.g. 'Image is blurry — please re-upload'"
                      className="flex-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-[var(--pg-bg)] text-[var(--pg-text)] px-3 py-2 outline-none focus:border-[var(--pg-primary)]"
                    />
                    <button
                      onClick={() => review(d.id, "reject")}
                      disabled={!reason.trim() || busyId === d.id}
                      className="text-xs font-bold px-4 py-2 rounded-lg bg-red-600 text-white cursor-pointer disabled:opacity-50"
                    >
                      Confirm reject
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
