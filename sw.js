// BEBC Badminton — offline service worker
// Caches the app so it opens and runs with no internet at the gym.
const CACHE = 'bebc-v4';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './preview.png'])).catch(()=>{}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // never cache the live sync worker — always hit the network for it
  if (url.hostname.indexOf('workers.dev') !== -1) return;
  if (e.request.method !== 'GET') return;
  // network-first: fresh when online, cached copy when offline
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
