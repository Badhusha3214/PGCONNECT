// Server-side GET against the Workers API with ISR caching. Returns parsed JSON,
// or null on any failure so pages degrade gracefully instead of erroring.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function apiGet(path, { revalidate = 300, timeoutMs = 8000 } = {}) {
  try {
    // A stalled API must not hang server-rendered pages (city pages, sitemap):
    // give up after `timeoutMs` and let the page render what it can.
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
