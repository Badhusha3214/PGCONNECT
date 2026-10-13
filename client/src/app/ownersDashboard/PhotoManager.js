"use client";
import { useState } from "react";
import { addPropertyPhotos, deletePropertyPhoto, reorderPropertyPhotos } from "../api";
import { MAX_PHOTOS, PHOTO_TYPES, PHOTO_ACCEPT, compressPhoto } from "../../lib/photos";

const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0);

// Add, remove and pick the cover photo for one of the owner's existing PGs.
export default function PhotoManager({ property, onChanged }) {
  const [photos, setPhotos] = useState(() => (property.property_images || []).slice().sort(byPosition));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const run = async (label, action, successText) => {
    setError("");
    setDone("");
    setBusy(label);
    try {
      await action();
      if (successText) setDone(successText);
      onChanged?.();
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setBusy("");
    }
  };

  const add = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => PHOTO_TYPES.includes(f.type));
    const room = MAX_PHOTOS - photos.length;
    if (picked.length === 0) { setError("Choose JPG, PNG or WebP photos."); return; }
    if (room <= 0) { setError(`A PG can have up to ${MAX_PHOTOS} photos. Remove one first.`); return; }
    const count = Math.min(picked.length, room);
    run(`Uploading ${count} photo${count === 1 ? "" : "s"}…`, async () => {
      const files = await Promise.all(picked.slice(0, room).map(compressPhoto));
      const res = await addPropertyPhotos(property.id, files);
      setPhotos((prev) => [...prev, ...(res.images || [])].sort(byPosition));
      if (picked.length > room) setError(`Only ${room} more photo${room === 1 ? "" : "s"} could be added (limit ${MAX_PHOTOS}).`);
    }, `${count} photo${count === 1 ? "" : "s"} added — students can see ${count === 1 ? "it" : "them"} now.`);
  };

  const remove = (photo) => {
    if (!window.confirm("Remove this photo from your listing?")) return;
    run("Removing…", async () => {
      await deletePropertyPhoto(property.id, photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    }, "Photo removed.");
  };

  const makeCover = (photo) => {
    const ordered = [photo, ...photos.filter((p) => p.id !== photo.id)].map((p, i) => ({ ...p, position: i }));
    run("Saving…", async () => {
      await reorderPropertyPhotos(property.id, ordered.map((p) => p.id));
      setPhotos(ordered);
    }, "Cover photo updated — it's now the first photo in search.");
  };

  return (
    <div className="mt-3 rounded-2xl border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="m-0 text-xs text-[var(--pg-text-secondary)]">
          {photos.length}/{MAX_PHOTOS} photos · the first one is the cover students see in search.
        </p>
        <label className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white ${busy || photos.length >= MAX_PHOTOS ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} style={{ background: "var(--pg-terracotta)" }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {busy || "Add photos"}
          <input
            type="file"
            accept={PHOTO_ACCEPT}
            multiple
            className="sr-only"
            disabled={Boolean(busy) || photos.length >= MAX_PHOTOS}
            onChange={(e) => { add(e.target.files); e.target.value = ""; }}
          />
        </label>
      </div>

      {error && <p role="alert" className="m-0 mb-3 text-xs text-red-600">{error}</p>}
      {done && !error && <p role="status" className="m-0 mb-3 text-xs font-semibold text-green-700">{done}</p>}

      {photos.length === 0 ? (
        <p className="m-0 text-sm text-[var(--pg-text-tertiary)]">No photos yet — add a few so students can see your rooms.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          {photos.map((p, i) => (
            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-white">
              {p.image_url && <img src={p.image_url} alt={`${property.name} photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />}
              {i === 0 ? (
                <span className="absolute left-1.5 bottom-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--pg-terracotta)" }}>Cover</span>
              ) : (
                <button type="button" onClick={() => makeCover(p)} disabled={Boolean(busy)}
                  className="absolute left-1.5 bottom-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[var(--pg-ink)] cursor-pointer disabled:opacity-50">
                  Make cover
                </button>
              )}
              <button type="button" onClick={() => remove(p)} disabled={Boolean(busy)} aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1.5 top-1.5 w-7 h-7 grid place-items-center rounded-full bg-black/60 text-white cursor-pointer disabled:opacity-50">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
