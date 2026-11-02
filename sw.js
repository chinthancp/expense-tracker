const CACHE_NAME = 'spendwise-cache-v2'; // Version bumped to clear old mobile caches

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event: Cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force the waiting service worker to become active immediately
  self.skipWaiting();
});

// Activate Event: Clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately without requiring a browser restart
  self.clients.claim();
});

// Fetch Event: Network-First strategy
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests (like Firebase Firestore syncing)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the network request is successful, update the cache with the fresh file
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If the network fails (offline), load the app from the cache
        return caches.match(event.request);
      })
  );
});
