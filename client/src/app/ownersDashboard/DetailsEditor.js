"use client";
import { useState } from "react";
import { updateProperty } from "../api";
import { AMENITIES, GENDERS } from "../../lib/listing";

const inputCls = "w-full bg-white border border-[var(--pg-border)] rounded-xl px-3 py-2 text-sm text-[var(--pg-text)] outline-none focus:border-[var(--pg-terracotta)]";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-1";

const FIELDS = [
  { key: "name", label: "PG name", required: true },
  { key: "tagline", label: "Tagline" },
  { key: "address", label: "Address", required: true },
  { key: "landmark", label: "Landmark" },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State", required: true },
  { key: "manager_name", label: "Manager name" },
  { key: "manager_phone", label: "Manager phone", type: "tel" },
];

// Older listings store amenities as "wifi", "WiFi", "ac"… — map them onto the
// standard names so they show as ticked, and keep anything unrecognised as-is.
const canonical = (a) => {
  const key = String(a).toLowerCase().replace(/[^a-z]/g, "");
  return AMENITIES.find((x) => x.toLowerCase().replace(/[^a-z]/g, "") === key) || String(a);
};
const normalizeAmenities = (list) => [...new Set((Array.isArray(list) ? list : []).map(canonical))];

// Edit a PG's listing details (not rooms or photos — those have their own panels).
export default function DetailsEditor({ property, onChanged, onClose }) {
  const originalAmenities = normalizeAmenities(property.amenities);
  const [form, setForm] = useState(() => ({
    ...Object.fromEntries(FIELDS.map((f) => [f.key, property[f.key] ?? ""])),
    gender: property.gender || "Co-ed",
    amenities: originalAmenities,
  }));
  // Standard choices plus any custom ones this PG already has (e.g. "Housekeeping").
  const amenityChoices = [...AMENITIES, ...originalAmenities.filter((a) => !AMENITIES.includes(a))];
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isLive = property.status === "verified";

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleAmenity = (a) =>
    set("amenities", form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a]);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    const missing = FIELDS.find((f) => f.required && !String(form[f.key]).trim());
    if (missing) { setError(`${missing.label} can't be empty.`); return; }

    // Only send what changed, so an untouched form doesn't trigger a re-review.
    const changes = {};
    for (const key of [...FIELDS.map((f) => f.key), "gender"]) {
      const value = typeof form[key] === "string" ? form[key].trim() : form[key];
      if (value !== (property[key] ?? "")) changes[key] = value;
    }
    const before = [...originalAmenities].sort().join(",");
    if ([...form.amenities].sort().join(",") !== before) changes.amenities = form.amenities;
    if (Object.keys(changes).length === 0) { onClose?.("No changes to save."); return; }

    if (isLive && !window.confirm("Saving will send your PG back for admin review, and it will be hidden from search until it's approved again. Continue?")) {
      return;
    }

    setSaving(true);
    try {
      const res = await updateProperty(property.id, changes);
      onChanged?.();
      onClose?.(res?.sent_for_review
        ? "Details saved. Your PG is back in the admin review queue and will reappear in search once approved."
        : "Details saved.");
    } catch (err) {
      setError(err.message || "Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-3 rounded-2xl border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4 space-y-3">
      {isLive && (
        <p className="m-0 text-xs font-semibold rounded-lg px-3 py-2" style={{ background: "#FFF4D6", color: "#5A3E00" }}>
          This PG is live. Changing these details sends it back for admin review. (Rooms, prices and photos can be changed without review.)
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className={labelCls} htmlFor={`${property.id}-${f.key}`}>{f.label}{f.required && " *"}</label>
            <input id={`${property.id}-${f.key}`} type={f.type || "text"} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
          </div>
        ))}
      </div>

      <div>
        <span className={labelCls}>For</span>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button key={g} type="button" onClick={() => set("gender", g)} aria-pressed={form.gender === g}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
              style={form.gender === g ? { borderColor: "var(--pg-terracotta)", color: "var(--pg-terracotta)", background: "white" } : { borderColor: "var(--pg-border)", background: "white" }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={labelCls}>Amenities</span>
        <div className="flex flex-wrap gap-2">
          {amenityChoices.map((a) => (
            <button key={a} type="button" onClick={() => toggleAmenity(a)} aria-pressed={form.amenities.includes(a)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
              style={form.amenities.includes(a) ? { borderColor: "var(--pg-terracotta)", color: "var(--pg-terracotta)", background: "white" } : { borderColor: "var(--pg-border)", background: "white" }}>
              {form.amenities.includes(a) ? "✓ " : ""}{a}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="m-0 text-xs text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="text-xs font-bold px-4 py-2 rounded-full text-white cursor-pointer disabled:opacity-60" style={{ background: "var(--pg-terracotta)" }}>
          {saving ? "Saving…" : "Save details"}
        </button>
        <button type="button" onClick={() => onClose?.()} className="text-xs font-semibold text-[var(--pg-text-secondary)] cursor-pointer">Cancel</button>
      </div>
    </form>
  );
}
