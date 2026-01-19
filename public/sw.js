const CACHE_NAME = 'splitease-v16'; // ✅ Bumped to v16


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
  
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        
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
// ============================================
// FETCH - Network-first for everything except static assets
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // ✅ FIX: Ignore non-HTTP(S) requests (chrome-extension, blob, data, etc.)
  if (!request.url.startsWith('http')) {
    return; // Let browser handle it natively
  }
  
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
        // ✅ Only cache valid HTTP responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone).catch(err => {
              // Silently ignore cache errors (e.g., quota exceeded)
              console.warn('[SW] Cache put failed:', err);
            });
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
  
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      
    })
  );
  
  // Don't claim clients immediately
  // self.clients.claim(); // ❌ KEEP COMMENTED
});


// ============================================
// PUSH NOTIFICATIONS - WebSocket alternative
// ============================================
self.addEventListener('push', function(event) {
  
  
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
      
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    vibrate: [150], // ✅ CHANGED: Single gentle vibration (150ms)
    silent: false, // ✅ ADDED: Use system notification sound
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
  
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options.applicationServerKey
    })
      .then(function(newSubscription) {
        
        
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
  
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
