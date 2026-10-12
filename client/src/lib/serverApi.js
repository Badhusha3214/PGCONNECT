// Server-side GET against the Workers API with ISR caching. Returns parsed JSON,
// or null on any failure so pages degrade gracefully instead of erroring.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function apiGet(path, { revalidate = 300 } = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
