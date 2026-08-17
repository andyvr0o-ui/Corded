// Corded service worker
// Bump CACHE_VERSION whenever you want every client to drop its cached assets.
const CACHE_VERSION = 'v4';
const CACHE_NAME    = `corded-${CACHE_VERSION}`;

// Origin-relative so this works on whatever domain it's served from.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      // Individual adds so one missing file can't fail the whole install
      .then(cache => Promise.all(
        ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('SW skip', url, err))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Only same-origin GETs — never intercept the team API or Google Drive
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate'
              || req.destination === 'document'
              || accept.includes('text/html');

  if (isHTML) {
    // Network first — always try for the latest index.html
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache first for static assets, refreshed in the background
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Allows the page to force activation
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
