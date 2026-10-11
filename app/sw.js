/* Pillar service worker: precaches the app shell so it works offline. Personal data lives in localStorage, never in this cache. */
const CACHE = 'pillar-v1';
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./content.js",
  "./manifest.json",
  "./assets/apple-touch-icon-180.png",
  "./assets/empty-meals.svg",
  "./assets/empty-weighins.svg",
  "./assets/empty-workouts.svg",
  "./assets/faq-calorie-surplus.svg",
  "./assets/faq-cardio.svg",
  "./assets/faq-gain-rate.svg",
  "./assets/faq-protein.svg",
  "./assets/faq-scale-not-moving.svg",
  "./assets/faq-sleep.svg",
  "./assets/faq-supplements.svg",
  "./assets/favicon-32.png",
  "./assets/favicon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/logo-wordmark.svg",
  "./assets/logo.svg",
  "./assets/recipe-chocolate-berry-protein-shake.svg",
  "./assets/recipe-greek-yogurt-power-bowl.svg",
  "./assets/recipe-loaded-avocado-egg-toast.svg",
  "./assets/recipe-no-cook-trail-mix.svg",
  "./assets/recipe-peanut-butter-banana-oat-shake.svg"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pillar-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Cache-first for same-origin GETs, with a background refresh; navigations fall back to the cached app shell offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(cached => {
    const net = fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
    return cached || net;
  }));
});
