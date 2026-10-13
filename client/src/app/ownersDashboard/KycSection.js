"use client";
import { useEffect, useRef, useState } from "react";
import { uploadKycDocument, getMyKycDocuments, deleteKycDocument, openKycDocument } from "../api";

const DOC_TYPES = [
  { value: "aadhaar", label: "Aadhaar card" },
  { value: "pan", label: "PAN card" },
  { value: "driving_license", label: "Driving licence" },
  { value: "passport", label: "Passport" },
  { value: "property_proof", label: "Property ownership / rent agreement" },
];
const LABELS = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));
const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

export default function KycSection() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState("aadhaar");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const res = await getMyKycDocuments();
      setDocs(res.documents ?? []);
    } catch {
      setMessage({ type: "error", text: "Couldn't load your documents." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onPick = (e) => {
    const f = e.target.files?.[0] ?? null;
    setMessage({ type: "", text: "" });
    if (f && f.size > MAX_BYTES) {
      setMessage({ type: "error", text: "File must be 5 MB or smaller." });
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!file) { setMessage({ type: "error", text: "Choose a file first." }); return; }
    setUploading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await uploadKycDocument(docType, file);
      setMessage({ type: "ok", text: res.message || "Uploaded." });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const onRemove = async (id) => {
    try {
      await deleteKycDocument(id);
      setDocs((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Couldn't remove it." });
    }
  };

  const onView = async (id) => {
    try { await openKycDocument(id); }
    catch { setMessage({ type: "error", text: "Couldn't open the document." }); }
  };

  const verified = docs.some((d) => d.status === "approved" && d.doc_type !== "property_proof");

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--pg-text)]">Identity verification (KYC)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload an ID proof so tenants see you as a verified owner. Files are private — only you and the PGCON team can open them.
          </p>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${verified ? STATUS_STYLES.approved : STATUS_STYLES.pending}`}>
          {verified ? "Verified owner" : "Not verified yet"}
        </span>
      </div>

      <form onSubmit={onUpload} className="flex flex-col sm:flex-row gap-3 sm:items-end mb-4">
        <label className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Document type</span>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--pg-bg)] text-[var(--pg-text)] px-3 py-2.5 outline-none focus:border-[var(--pg-primary)]"
          >
            {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>
        <label className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">File (PDF, JPG, PNG · max 5 MB)</span>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            onChange={onPick}
            className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-xs file:font-semibold file:bg-[var(--pg-chip-bg)] file:text-[var(--pg-primary)] cursor-pointer"
          />
        </label>
        <button
          type="submit"
          disabled={uploading || !file}
          className="text-sm font-bold px-5 py-2.5 rounded-xl text-white cursor-pointer disabled:opacity-50 shrink-0"
          style={{ background: "var(--pg-primary)" }}
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {message.text && (
        <p className={`text-xs font-medium mb-3 ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>{message.text}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700 border-t border-slate-100 dark:border-slate-700">
          {docs.map((d) => (
            <li key={d.id} className="py-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--pg-text)]">{LABELS[d.doc_type] ?? d.doc_type}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{d.file_name}</p>
                {d.status === "rejected" && d.rejection_reason && (
                  <p className="text-xs text-red-600 mt-0.5">Rejected: {d.rejection_reason}</p>
                )}
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[d.status]}`}>{d.status}</span>
              <button onClick={() => onView(d.id)} className="text-xs font-semibold text-[var(--pg-primary)] cursor-pointer hover:underline">View</button>
              {d.status !== "approved" && (
                <button onClick={() => onRemove(d.id)} className="text-xs font-semibold text-red-600 cursor-pointer hover:underline">Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
