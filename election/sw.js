/* Election Night dashboard: a small service worker so the page itself opens instantly
   (and still opens offline). Same-origin files are served network-first with a cached
   fallback; everything else (streams, APIs, Bluesky) goes straight to the network. */
const VERSION = 'election-v3';
const PRECACHE = ['/election/', '/images/bri-wordmark.svg', '/images/bri-wordmark-light.svg', '/images/favicon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || (e.request.mode === 'navigate' ? caches.match('/election/') : undefined)))
  );
});
