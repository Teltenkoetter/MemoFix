const CACHE = 'memofix-v239';
const SHELL = ['./index.html', './style.css', './app.js', './manifest.json', './icon.svg', './ki-briefing.md', './ki-briefing-raten.md', './impressum.html', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './fonts/InstrumentSerif-italic-latin-ext.woff2', './fonts/InstrumentSerif-italic-latin.woff2', './fonts/InstrumentSerif-normal-latin-ext.woff2', './fonts/InstrumentSerif-normal-latin.woff2', './fonts/Inter-normal-latin-ext.woff2', './fonts/Inter-normal-latin.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
