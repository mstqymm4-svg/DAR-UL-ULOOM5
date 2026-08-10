// ─────────────────────────────────────────────────────────────────────────
// Media URL resolution — single source of truth for API + media origins.
//
// The web app talks to the backend same-origin (relative /api and
// /uploads paths). The packaged Android app is served from Capacitor's own
// local origin (https://localhost), so every relative URL must be prefixed
// with the production API origin that was baked in at build time via
// VITE_API_BASE.
//
//   - VITE_API_BASE empty (web / dev / PWA) → URLs used exactly as stored.
//   - VITE_API_BASE set (Android build)     → relative /uploads/... URLs are
//     prefixed with the API origin so the device fetches them from the
//     production server, not its own WebView.
//   - Absolute (http/https), data:, blob: URLs → never touched (YouTube,
//     CDNs, pasted data URLs, local object URLs).
// ─────────────────────────────────────────────────────────────────────────

export const API_BASE = (import.meta.env?.VITE_API_BASE ?? '').replace(/\/+$/, '');

/**
 * Core resolver — pure function (unit-testable without a build).
 * @param {string|null|undefined} url
 * @param {string} base - normalized API origin (no trailing slash), or ''
 */
export function resolveMediaUrlWithBase(url, base) {
  if (!url || typeof url !== 'string') return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!base) return url;
  const b = String(base).replace(/\/+$/, '');
  if (!b) return url;
  return `${b}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Resolve a media/upload URL against the configured API origin for this build.
 */
export function resolveMediaUrl(url) {
  return resolveMediaUrlWithBase(url, API_BASE);
}
