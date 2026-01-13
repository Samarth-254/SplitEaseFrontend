const CACHE_NAME = 'splitease-v7';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-192.png',  
  '/icon-512.png',
  '/badge-72.png',
  '/apple-touch-icon.png'
];


// Install event
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('[Service Worker] Cache failed:', err);
        });
      })
  );
  // ✅ IMPORTANT: Don't skipWaiting() - let it wait for user refresh
  // self.skipWaiting(); // ❌ REMOVE THIS!
});

// Fetch event
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // ✅ Network-first for API calls, cache-first for assets
  if (event.request.url.includes('/api/')) {
    // Always fetch API calls from network
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for other resources
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Return offline page if available
          return caches.match('/index.html');
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // ✅ IMPORTANT: Don't claim() immediately - let user refresh naturally
      // self.clients.claim(); // ❌ REMOVE THIS!
      
    })
  );
});

// ✅ PUSH NOTIFICATION HANDLER
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
    console.error('[Service Worker] Error parsing push data:', e);
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
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ✅ NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', function(event) {
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ✅ PUSH SUBSCRIPTION CHANGE HANDLER
self.addEventListener('pushsubscriptionchange', function(event) {
  
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options.applicationServerKey
    })
      .then(function(newSubscription) {
        
        
        // Signal to clients that subscription changed
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
        console.error('[Service Worker] Resubscription failed:', error);
      })
  );
});
