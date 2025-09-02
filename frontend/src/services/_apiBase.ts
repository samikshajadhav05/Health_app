// Centralized, robust API base resolver.
// Handles values like ":5001", "localhost:5001", "/api", "http://localhost:5001/api", etc.
export function resolveApiBase(): string {
  const raw = (import.meta as any)?.env?.VITE_API_BASE_URL;

  // default: same-origin /api
  if (!raw) return "/api";

  let val = String(raw).trim();

  // If they set just "/api" or "/custom", respect it (same-origin paths)
  if (val.startsWith("/")) return val.replace(/\/$/, "");

  // If they set ":5001" or "5001"
  if (/^:?\d+$/.test(val)) {
    const port = val.startsWith(":") ? val : `:${val}`;
    return `${window.location.protocol}//${window.location.hostname}${port}/api`;
  }

  // If they set "localhost:5001" or "127.0.0.1:5001"
  if (/^[\w.-]+:\d+$/.test(val)) {
    return `http://${val}/api`;
  }

  // If they set a full URL, keep it
  if (/^https?:\/\//i.test(val)) return val.replace(/\/$/, "");

  // Fallback: treat as host (e.g., "api.myapp.com")
  return `https://${val}/api`;
}