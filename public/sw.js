const CACHE_NAME = 'simulasi-rme-cache-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/rme_rajal_batch2.json',
  '/rme_rajal_batch3.json',
  '/rme_rajal_batch4.json',
  '/rme_ranap_diare_21.json',
  '/rme_ranap_asma_22.json',
  '/rme_ranap_pielo_23.json',
  '/rme_ranap_hepa_24.json',
  '/rme_ranap_hipogli_25.json'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event: any) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cache or fetch over network and cache it
      return (
        cached ||
        fetch(event.request).then((res) => {
          if (!res || res.status !== 200 || res.type !== 'basic') {
            return res;
          }
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
          return res;
        }).catch(() => {
          // If both fail and it's a page navigation, return index.html from cache
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
      );
    })
  );
});
