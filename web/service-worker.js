/* eslint-disable no-restricted-globals */
/**
 * stroke-mgmt service worker.
 *
 * Layered on top of the IndexedDB content cache (CMS JSON lives there).
 * The SW handles the *asset* layer:
 *
 *  - Install: precache the app shell (HTML, hashed JS/CSS, favicon, manifest,
 *    PWA icons). The list is generated at build time by
 *    `scripts/postBuildWeb.js` and dropped in `dist/precache-manifest.json`.
 *  - Activate: drop any cache whose name doesn't match this build's hash
 *    (`__BUILD_HASH__` is replaced by the post-build script).
 *  - Fetch:
 *      * CMS image bytes (`stroke-mgmt-cms.a2hosted.com/uploads/*`) →
 *        stale-while-revalidate against a long-lived cache that survives
 *        app-shell version bumps.
 *      * Same-origin requests under the app's baseUrl (i.e. the shell) →
 *        cache-first, network fallback, opportunistic cache fill.
 *      * Everything else (in particular the CMS API JSON at
 *        `/api/articles`, `/api/algorithms`) → pass through. The IndexedDB
 *        layer is the single source of truth for that data; the SW must
 *        not double-cache it.
 *
 * This file is served verbatim to the browser by Expo's web pipeline; do
 * not let a bundler touch it. Plain ES that any modern browser running a
 * service worker understands is fine.
 */

const BUILD_HASH = '__BUILD_HASH__';
const APP_SHELL_CACHE = `stroke-mgmt-app-shell-${BUILD_HASH}`;
const CMS_IMAGES_CACHE = 'stroke-mgmt-cms-images-v1';
const PRECACHE_MANIFEST_URL = 'precache-manifest.json';
const CMS_IMAGES_ORIGIN = 'https://stroke-mgmt-cms.a2hosted.com';
const CMS_IMAGES_PATH_PREFIX = '/uploads/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const manifestUrl = new URL(PRECACHE_MANIFEST_URL, self.registration.scope);
        const response = await fetch(manifestUrl.toString(), { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`precache-manifest fetch failed: ${response.status}`);
        }
        const entries = await response.json();
        const cache = await caches.open(APP_SHELL_CACHE);
        const urls = entries.map((entry) => new URL(entry.url, self.registration.scope).toString());
        // addAll is atomic; if any single asset fails the whole install fails.
        await cache.addAll(urls);
      } catch (err) {
        // Don't block install on a partial precache. The fetch handler still
        // works against the network; subsequent visits will warm the cache
        // opportunistically.
        // eslint-disable-next-line no-console
        console.warn('[stroke-mgmt SW] precache failed:', err);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key === APP_SHELL_CACHE || key === CMS_IMAGES_CACHE) return undefined;
          if (key.startsWith('stroke-mgmt-app-shell-')) return caches.delete(key);
          return undefined;
        })
      );
      await self.clients.claim();
    })()
  );
});

function isCmsImageRequest(url) {
  return url.origin === CMS_IMAGES_ORIGIN && url.pathname.startsWith(CMS_IMAGES_PATH_PREFIX);
}

function isAppShellRequest(url) {
  if (url.origin !== self.location.origin) return false;
  const scopePath = new URL(self.registration.scope).pathname;
  return url.pathname.startsWith(scopePath);
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CMS_IMAGES_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  if (cached) {
    // Don't wait for the revalidation; let it run in the background.
    networkPromise.catch(() => {});
    return cached;
  }
  const network = await networkPromise;
  if (network) return network;
  // No cache, no network — let the browser surface the failure.
  return fetch(request);
}

async function cacheFirst(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && request.method === 'GET') {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    // For navigations, fall back to the cached shell index if we have one.
    if (request.mode === 'navigate') {
      const fallback = await cache.match(new URL(self.registration.scope).toString());
      if (fallback) return fallback;
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (isCmsImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (isAppShellRequest(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (CMS API JSON, third-party, etc.) — passthrough.
});
