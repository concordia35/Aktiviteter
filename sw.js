const CACHE_NAME = 'concordia-aktiviteter-v101-network-first';
const ASSETS = [
  './','./index.html','./style.css','./app.js','./events.json','./logeaftener.json','./manifest.webmanifest',
  './assets/chainlinks.jpg','./assets/chainlinks.svg','./icons/icon-192.png','./icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(url.hostname.includes('script.google.com')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
