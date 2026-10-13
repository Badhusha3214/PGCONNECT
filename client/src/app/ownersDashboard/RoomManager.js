"use client";
import { useState } from "react";
import { updateProperty } from "../api";
import { ROOM_TYPES, roomLabel } from "../../lib/listing";

// A bed booked through PGCON (held at checkout, on notice, or occupied by a
// booking). Owners can't change these; the Worker uses the same rule.
const isHeld = (b) =>
  b.status === "locked" || b.status === "notice-period" || (b.status === "occupied" && Boolean(b.current_booking_id));

const toRow = (r) => {
  const beds = r.beds || [];
  return {
    id: r.id,
    type: r.type,
    price: String(r.price ?? ""),
    totalBeds: String(beds.length || r.total_beds || ""),
    available: String(beds.filter((b) => b.status === "vacant").length),
    description: r.description ?? "",
    held: beds.filter(isHeld).length,
  };
};

const inputCls = "w-full bg-white border border-[var(--pg-border)] rounded-xl px-3 py-2 text-sm text-[var(--pg-text)] outline-none focus:border-[var(--pg-terracotta)]";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-[var(--pg-text-tertiary)] mb-1";

// Add, edit and remove room types — price, total beds and how many are free —
// on an existing PG.
export default function RoomManager({ property, onChanged }) {
  const [rows, setRows] = useState(() => (property.property_rooms || []).map(toRow));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const usedTypes = rows.map((r) => r.type);
  const freeTypes = ROOM_TYPES.filter((t) => !usedTypes.includes(t));

  const update = (i, field, value) => {
    setDone("");
    setRows((prev) => prev.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, [field]: value };
      // A brand-new room starts fully available until the owner says otherwise.
      if (field === "totalBeds" && !r.id && (r.available === "" || r.available === r.totalBeds)) next.available = value;
      return next;
    }));
  };
  const addRow = () => {
    if (freeTypes.length === 0) return;
    setDone("");
    setRows((prev) => [...prev, { type: freeTypes[0], price: "", totalBeds: "", available: "", description: "", held: 0 }]);
  };
  const removeRow = (i) => {
    setDone("");
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    setError("");
    setDone("");
    if (rows.length === 0) { setError("Add at least one room type."); return; }
    for (const r of rows) {
      const name = roomLabel(r.type);
      if (!(Number(r.price) > 0)) { setError(`Enter a monthly price for the ${name} room.`); return; }
      const total = Number(r.totalBeds);
      if (!Number.isInteger(total) || total < 1) { setError(`Enter the total number of beds in the ${name} room (at least 1).`); return; }
      if (total < r.held) { setError(`The ${name} room has ${r.held} bed${r.held === 1 ? "" : "s"} booked through PGCON — total beds can't be fewer than that.`); return; }
      const available = r.available === "" ? total - r.held : Number(r.available);
      if (!Number.isInteger(available) || available < 0) { setError(`Enter how many beds are available in the ${name} room (0 or more).`); return; }
      if (available > total - r.held) {
        setError(`Only ${total - r.held} bed${total - r.held === 1 ? "" : "s"} in the ${name} room can be available${r.held ? ` — ${r.held} ${r.held === 1 ? "is" : "are"} booked through PGCON` : ""}.`);
        return;
      }
    }
    setSaving(true);
    try {
      await updateProperty(property.id, {
        rooms: rows.map((r) => {
          const total = Number(r.totalBeds);
          return {
            ...(r.id ? { id: r.id } : {}),
            type: r.type,
            price: Number(r.price),
            total_beds: total,
            available_beds: r.available === "" ? total - r.held : Number(r.available),
            description: r.description.trim(),
          };
        }),
      });
      setDone("Rooms saved — students now see these beds, prices and availability.");
      onChanged?.();
    } catch (e) {
      setError(e.message || "Couldn't save the rooms. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4 space-y-3">
      <p className="m-0 text-xs text-[var(--pg-text-secondary)]">
        For each room type, set the price, how many beds it has in total, and how many are free right now.
        Beds taken by tenants who didn&apos;t book on PGCON should not be counted as available.
      </p>

      {rows.length === 0 && (
        <p className="m-0 text-sm font-semibold" style={{ color: "var(--pg-terracotta)" }}>
          No rooms yet — students see “Full right now” until you add at least one room type.
        </p>
      )}

      {rows.map((r, i) => (
        <div key={r.id || `new-${i}`} className="rounded-xl bg-white border border-[var(--pg-border)] p-3 grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className={labelCls}>Room type</label>
            <select value={r.type} onChange={(e) => update(i, "type", e.target.value)} className={inputCls} disabled={Boolean(r.id)}>
              {[r.type, ...freeTypes].map((t) => <option key={t} value={t}>{roomLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Price / bed / month (₹)</label>
            <input type="number" min="1" inputMode="numeric" value={r.price} onChange={(e) => update(i, "price", e.target.value)} placeholder="6000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Total beds</label>
            <input type="number" min={Math.max(1, r.held)} inputMode="numeric" value={r.totalBeds} onChange={(e) => update(i, "totalBeds", e.target.value)} placeholder="4" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Available now</label>
            <input type="number" min="0" max={Math.max(Number(r.totalBeds || 0) - r.held, 0)} inputMode="numeric" value={r.available} onChange={(e) => update(i, "available", e.target.value)} placeholder={r.totalBeds || "4"} className={inputCls} />
          </div>
          <div className="flex items-end">
            {r.held === 0 ? (
              <button type="button" onClick={() => removeRow(i)} className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer py-2">Remove</button>
            ) : (
              <span className="text-[10px] text-[var(--pg-text-tertiary)] py-2" title="Rooms with beds booked through PGCON can't be removed">In use</span>
            )}
          </div>
          {r.held > 0 && (
            <p className="col-span-2 sm:col-span-5 m-0 text-[11px] text-[var(--pg-text-tertiary)]">
              {r.held} bed{r.held === 1 ? " is" : "s are"} booked through PGCON and managed automatically.
            </p>
          )}
          <div className="col-span-2 sm:col-span-5">
            <input type="text" value={r.description} onChange={(e) => update(i, "description", e.target.value)} placeholder="e.g. Attached bathroom, study table" className={inputCls} />
          </div>
        </div>
      ))}

      {error && <p role="alert" className="m-0 text-xs text-red-600">{error}</p>}
      {done && !error && <p role="status" className="m-0 text-xs font-semibold text-green-700">{done}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {freeTypes.length > 0 && (
          <button type="button" onClick={addRow} className="text-xs font-bold px-3 py-2 rounded-full border border-dashed border-[var(--pg-border)] bg-white cursor-pointer hover:border-[var(--pg-terracotta)]">
            + Add {roomLabel(freeTypes[0])} room
          </button>
        )}
        <button type="button" onClick={save} disabled={saving} className="text-xs font-bold px-4 py-2 rounded-full text-white cursor-pointer disabled:opacity-60" style={{ background: "var(--pg-terracotta)" }}>
          {saving ? "Saving…" : "Save rooms"}
        </button>
      </div>
    </div>
  );
}
