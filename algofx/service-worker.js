// AlgoFX Service Worker – Offline First
// v2 – added supabase-auth.js, smarter fetch strategy
const CACHE_NAME = 'algofx-cache-v2';

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
  './files/error-highlighting.js',
  './files/error-highlighting.css',
  './files/supabase-auth.js',   // ← NEW
  // Assets
  './files/fxlogo.png',
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

// ── INSTALL – pre-cache all local assets ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// ── ACTIVATE – delete stale caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function isExternal(url) {
  return !url.startsWith(self.location.origin);
}

function isApiCall(url) {
  // Supabase REST / Auth / Realtime endpoints – never serve from cache
  return url.includes('supabase.co') || url.includes('supabase.io');
}

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // 1. Never intercept non-GET requests (POST/PUT/DELETE to Supabase, etc.)
  if (request.method !== 'GET') return;

  // 2. Supabase API calls → always go to network, never cache
  if (isApiCall(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. External CDN (jsdelivr, etc.) → network-first, fall back to cache
  if (isExternal(url)) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 4. Local assets → cache-first, fall back to network then offline page
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(networkResponse => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});