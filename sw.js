const CACHE_NAME = 'gastrocost-v12-cache';
const ASSETS_TO_CACHE = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Intentar cachear assets por defecto
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Algunos recursos no pudieron ser precacheados durante la instalacion:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Solo cachear peticiones GET externas (CDNs, Fuentes)
  if (event.request.method !== 'GET') return;
  
  const url = event.request.url;
  const shouldCache = url.includes('cdnjs.cloudflare.com') || 
                      url.includes('fonts.googleapis.com') || 
                      url.includes('fonts.gstatic.com');

  if (shouldCache) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Retornar de cache inmediatamente, y actualizar de fondo (stale-while-revalidate)
          fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        }).catch(err => {
          console.error('Fallo la peticion de red y no hay cache:', err);
        });
      })
    );
  }
});
