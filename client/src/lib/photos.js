// Shared rules for PG photos — must match the Worker's limits in
// backend/src/routes/properties.ts (10 photos, JPG/PNG/WebP, 5 MB each).
export const MAX_PHOTOS = 10;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_ACCEPT = PHOTO_TYPES.join(",");
const MAX_PHOTO_SIDE = 1600;

// Phone photos are often 5–10 MB; shrink to ≤1600px JPEG before upload so
// they stay under the server limit and load fast for students.
export const compressPhoto = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(src);
      const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file),
        "image/jpeg",
        0.82
      );
    };
    img.onerror = () => { URL.revokeObjectURL(src); resolve(file); };
    img.src = src;
  });
