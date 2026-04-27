/**
 * Web variant of `registerServiceWorker`.
 *
 * Registers `/stroke-mgmt-web-preview/service-worker.js` once the page has
 * loaded. The path is hardcoded to match `experiments.baseUrl` in
 * `app.config.js` — Expo doesn't surface that value as a runtime env var.
 *
 * TODO: if the hosting baseUrl ever needs to change per-deploy, lift this
 * into an `EXPO_PUBLIC_BASE_URL` env var and read it here.
 */

const SW_URL = '/stroke-mgmt-web-preview/service-worker.js';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[stroke-mgmt] SW registration failed:', err);
    });
  });
}
