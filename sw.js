/* MAGICAL MOVIE LAND — service worker */
const VERSION = 'mml-v4';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const CACHEABLE_HOSTS = ['cdnjs.cloudflare.com', 'www.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return; // video streaming ඒවා ඉවත් කරනවා
  const url = new URL(req.url);

  // Page navigation: network-first, offline නම් cache එකෙන්
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Same-origin files + Font Awesome + Firebase SDK: stale-while-revalidate
  if (url.origin === location.origin || CACHEABLE_HOSTS.includes(url.hostname)) {
    if (url.hostname === 'www.gstatic.com' && !url.pathname.startsWith('/firebasejs/')) return;
    e.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
  // Firestore / Auth / posters / videos: cache නොකර network එකට යවනවා
});
