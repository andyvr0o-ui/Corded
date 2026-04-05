const CACHE_NAME = 'corded-app-cache-v1';

// Add all the files your app needs to run offline here.
// Make sure these match your actual file names!
const urlsToCache = [
 './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. Install the Service Worker and save the files to the phone
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Intercept network requests and serve the saved files if offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the file is in the cache, return it!
        if (response) {
          return response;
        }
        // Otherwise, try to fetch it from the internet
        return fetch(event.request);
      })
  );
});
