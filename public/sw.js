const CACHE_NAME = 'splitease-v8';

// ✅ Only cache static assets (NEVER API data)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',  
  '/icon-512.png',
  '/badge-72.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

// ============================================
// INSTALL - Cache static assets only
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('[SW] Cache failed:', err))
  );
  
  // Don't activate immediately - wait for user refresh
  // self.skipWaiting(); // ❌ KEEP COMMENTED
});

// ============================================
// FETCH - Network-first for everything except static assets
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // ✅ NEVER cache these (always fresh from network)
  const NEVER_CACHE = [
    '/api/',           // All API endpoints
    '/socket.io/',     // WebSocket connections
    'sockjs-node',     // Dev WebSocket
    '.hot-update.',    // HMR updates
  ];
  
  // Check if URL should NEVER be cached
  const shouldNeverCache = NEVER_CACHE.some(pattern => 
    url.pathname.includes(pattern) || url.href.includes(pattern)
  );
  
  if (shouldNeverCache) {
    // ✅ Pure network - no caching at all
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Network unavailable' }), 
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }
  
  // ✅ For static assets: Cache-first (fast load)
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => cachedResponse || fetch(request))
    );
    return;
  }
  
  // ✅ For everything else: Network-first (fresh data)
  event.respondWith(
    fetch(request)
      .then(response => {
        // Optionally cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || caches.match('/index.html');
        });
      })
  );
});

// ============================================
// ACTIVATE - Clean up old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activated');
    })
  );
  
  // Don't claim clients immediately
  // self.clients.claim(); // ❌ KEEP COMMENTED
});

// ============================================
// PUSH NOTIFICATIONS - WebSocket alternative
// ============================================
self.addEventListener('push', function(event) {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'SplitEase',
    body: 'You have a new notification',
    url: '/',
    icon: '/icon-192.png',
    badge: '/badge-72.png'
  };

  try {
    if (event.data) {
      data = event.data.json();
      console.log('[SW] Push data:', data);
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    vibrate: [200, 100, 200],
    tag: 'splitease-notification',
    requireInteraction: false,
    data: {
      url: data.url || '/',
      timestamp: data.timestamp || new Date().toISOString()
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ============================================
// NOTIFICATION CLICK - Open app
// ============================================
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }

  const urlToOpen = new URL(
    event.notification.data.url || '/', 
    self.location.origin
  ).href;
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Focus existing window if open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============================================
// PUSH SUBSCRIPTION CHANGE - Resubscribe
// ============================================
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[SW] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options.applicationServerKey
    })
      .then(function(newSubscription) {
        console.log('[SW] Resubscribed:', newSubscription);
        
        // Notify clients about subscription change
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SUBSCRIPTION_CHANGED',
              subscription: newSubscription.toJSON()
            });
          });
        });
      })
      .catch(function(error) {
        console.error('[SW] Resubscription failed:', error);
      })
  );
});

// ============================================
// MESSAGE - Handle client messages
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
