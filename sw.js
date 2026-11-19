// Lets the game load without a connection after the first visit. Network first, so updates always win when online.
const CACHE = 'urbangame-chicago-7';
const FILES = ['./', 'index.html', 'teacher.html', 'css/style.css', 'js/main.js', 'js/sim.js', 'js/world.js', 'js/data.js', 'js/audio.js', 'js/report.js', 'js/portraits.js', 'vendor/three.module.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
