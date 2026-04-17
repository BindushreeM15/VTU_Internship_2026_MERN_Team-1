/**
 * Converts a relative /uploads/... path to an absolute URL.
 * In dev: proxied through Vite → backend:5000
 * In prod: use VITE_API_URL (Vercel backend URL)
 */
const BASE = import.meta.env.VITE_API_URL || "";

export function imgUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // In dev with Vite proxy, relative paths work directly
  // In prod, prepend the backend base URL
  if (BASE && !BASE.includes("localhost")) {
    return `${BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return path;
}
