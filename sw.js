const CACHE_NAME = 'concordia-v9';
const FILES = ['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./assets/vm-i-logen-2026.png','./assets/loppemarked-2026.png','./assets/sct-michaels-nat-2026.png','./assets/sct-patricks-day-2027.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => {e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))); self.skipWaiting();});
self.addEventListener('activate', e => {e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim();});
self.addEventListener('fetch', e => {if(e.request.method !== 'GET') return; e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));});
