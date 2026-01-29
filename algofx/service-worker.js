// AlgoFX Service Worker – Offline First

const CACHE_NAME = 'algofx-cache-v1';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './aide.html',

  // Core files
  './files/styles.css',
  './files/core.js',
  './files/templates.js',
  './files/stepsyntax.js',
  './files/LineNumberAutosave.js',
  './files/indentation.js',
  './files/autocomplete.js',
  './files/fxlogo.png',

  // Assets
  './assets/og-image.png',

  // Icons
  './assets/icons/icon-72.png',
  './assets/icons/icon-96.png',
  './assets/icons/icon-128.png',
  './assets/icons/icon-144.png',
  './assets/icons/icon-152.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-384.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-512-maskable.png'
];

// INSTALL – cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ACTIVATE – clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH – offline-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      // Optional: offline fallback
      return caches.match('./index.html');
    })
  );
});