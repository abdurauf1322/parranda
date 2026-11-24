// Service Worker for UYCHI PARRANDA PWA (Web Push + Offline Cache)
// Workbox manifest injection placeholder
self.__WB_MANIFEST;

const CACHE_NAME = 'uychi-parranda-v5';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/maskable-icon-192.png',
  '/maskable-icon-512.png',
  '/apple-touch-icon.png',
  '/icon.svg'
];

// Install Event - Pre-cache essential shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    })
  );
});

// Activate Event - Clean up obsolete caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

// Fetch Event - Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Never cache backend API calls
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Navigation requests (HTML) -> Network-First, fallback to cached '/'
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/');
          if (fallback) return fallback;
          return new Response('Offline: Tarmoqqa ulanish mavjud emas', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Static Assets -> Network-First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && (
          event.request.url.endsWith('.png') ||
          event.request.url.endsWith('.svg') ||
          event.request.url.endsWith('.json') ||
          event.request.url.endsWith('.js') ||
          event.request.url.endsWith('.css')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response('', { status: 408, statusText: 'Request timed out' });
      })
  );
});

// ============================================================
// WEB PUSH NOTIFICATIONS EVENT LISTENER (Background Web Push)
// ============================================================
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 Uychi Parranda',
    body: 'Yangi ogohlantirish yoki vazifa mavjud!',
    url: '/',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    silent: false,
    requireInteraction: true
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [300, 150, 300, 150, 450],
    tag: data.tag || 'uychi-parranda-urgent-alert',
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Ochish' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Listener - Focus or open tab when user clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Direct client message listener for immediate foreground notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'Uychi Parranda', options || {})
    );
  }
});
