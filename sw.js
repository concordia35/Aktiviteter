const CACHE_NAME = 'concordia-v20c';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './events.json',
  './logeaftener.json',
  './initiativer.json',
  './manifest.webmanifest',
  './assets/vm-i-logen-2026.png',
  './assets/loppemarked-2026.png',
  './assets/sct-michaels-nat-2026.png',
  './assets/sct-patricks-day-2027.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(url.pathname.endsWith('.json')){
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
