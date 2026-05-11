/* WorshipBase offline service worker — v8.17 Phase E.3.1
   Network-first for the app shell so GitHub/PWA launches do not run a stale index.html.
   Cache-first only for static same-origin assets. */
const WB_CACHE_VERSION = 'worshipbase-offline-v8-17-phase-e3-1';
const WB_CACHE_PREFIX = 'worshipbase-offline-';
const WB_APP_SHELL = './';
const WB_STATIC_ASSETS = [
  './',
  './manifest.webmanifest',
  './worshipbase_layered_fold_w_proper/app-icons/app-icon-180.png',
  './worshipbase_layered_fold_w_proper/app-icons/app-icon-192.png',
  './worshipbase_layered_fold_w_proper/app-icons/apple-touch-icon.png',
  './worshipbase_layered_fold_w_proper/png/worshipbase-mark-256.png',
  './worshipbase_layered_fold_w_proper/launch/launch-dark.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(WB_CACHE_VERSION)
      .then(cache => Promise.all(WB_STATIC_ASSETS.map(url => cache.add(url).catch(() => null))))
      .catch(() => null)
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(WB_CACHE_PREFIX) && key !== WB_CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event && event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document' || /\/index\.html(?:$|[?#])/.test(request.url);
}

function sameOrigin(request) {
  try { return new URL(request.url).origin === self.location.origin; }
  catch (e) { return false; }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (!request || request.method !== 'GET' || !sameOrigin(request)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(WB_CACHE_VERSION).then(cache => cache.put(WB_APP_SHELL, copy)).catch(() => null);
          return response;
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match(WB_APP_SHELL)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(hit => {
      if (hit) return hit;
      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(WB_CACHE_VERSION).then(cache => cache.put(request, copy)).catch(() => null);
        return response;
      });
    })
  );
});
