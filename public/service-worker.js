const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  STATIC: `${CACHE_VERSION}-static`,
  DYNAMIC: `${CACHE_VERSION}-dynamic`,
  IMAGES: `${CACHE_VERSION}-images`,
};

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/index.css',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      console.log('Cache opened');
      return cache.addAll(urlsToCache).catch(() => {
        console.log('Failed to cache some items during install');
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First Strategy for API, Cache First for Assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network first for API calls
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cache successful API responses
          const responseToCache = response.clone();
          caches.open(CACHE_NAMES.DYNAMIC).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline - Data not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' }),
            });
          });
        })
    );
    return;
  }

  // Cache first for images
  if (request.headers.get('Accept')?.includes('image')) {
    event.respondWith(
      caches.open(CACHE_NAMES.IMAGES).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }

          return fetch(request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            cache.put(request, responseToCache);
            return response;
          });
        });
      })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        if (url.pathname.includes('.js') || url.pathname.includes('.css')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAMES.STATIC).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});

// Handle Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prices') {
    event.waitUntil(syncPrices());
  } else if (event.tag === 'sync-news') {
    event.waitUntil(syncNews());
  }
});

async function syncPrices() {
  try {
    const response = await fetch('/api/prices');
    const data = await response.json();
    
    const cache = await caches.open(CACHE_NAMES.DYNAMIC);
    cache.put('/api/prices', new Response(JSON.stringify(data)));
    
    return true;
  } catch (error) {
    console.log('Sync prices failed:', error);
    return false;
  }
}

async function syncNews() {
  try {
    const response = await fetch('/api/news');
    const data = await response.json();
    
    const cache = await caches.open(CACHE_NAMES.DYNAMIC);
    cache.put('/api/news', new Response(JSON.stringify(data)));
    
    return true;
  } catch (error) {
    console.log('Sync news failed:', error);
    return false;
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New update from AgriSahayak',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png',
    tag: 'agrisahayak-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification('AgriSahayak', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return (client as WindowClient).focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
