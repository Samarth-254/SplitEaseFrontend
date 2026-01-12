import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ✅ FIXED: Register Service Worker PROPERLY
if ('serviceWorker' in navigator) {
  let registration = null;
  
  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
      
      
      // ✅ Check for updates periodically (every 30 minutes, not 1 hour)
      setInterval(() => {
        if (registration) {
          registration.update();
        }
      }, 30 * 60 * 1000);
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });

  // ✅ Handle SW updates WITHOUT killing subscriptions
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    
    
    // ✅ Save that we're about to reload (so we can resubscribe after)
    sessionStorage.setItem('sw-updated', 'true');
    
    window.location.reload();
  });

  // ✅ Listen for subscription change messages from SW
  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data.type === 'SUBSCRIPTION_CHANGED') {
      
      
      try {
        const { default: pushService } = await import('./services/pushNotification.js');
        
        // Get the new subscription
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.getSubscription();
        
        if (subscription) {
          // Send to backend
          const token = localStorage.getItem('token');
          if (token) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            await fetch(`${API_URL}/api/notifications/subscribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(subscription.toJSON())
            });
            
          }
        }
      } catch (err) {
        console.error('Failed to update subscription after SW change:', err);
      }
    }
  });

  // ✅ Resubscribe after SW update reload
  if (sessionStorage.getItem('sw-updated') === 'true') {
    sessionStorage.removeItem('sw-updated');
    
    // Wait a bit for SW to settle
    setTimeout(async () => {
      try {
        if (Notification.permission === 'granted') {
          const userDisabled = localStorage.getItem('notifications-user-disabled') === 'true';
          
          if (!userDisabled) {
            
            const { default: pushService } = await import('./services/pushNotification.js');
            await pushService.subscribeUser();
          }
        }
      } catch (err) {
        console.error('Failed to resubscribe after SW update:', err);
      }
    }, 2000);
  }

  // ✅ Check subscription health on visibility change
  let lastVisibilityChange = Date.now();
  
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      const now = Date.now();
      if (now - lastVisibilityChange < 30000) {
        return;
      }
      lastVisibilityChange = now;

      try {
        if (Notification.permission === 'granted') {
          const userDisabled = localStorage.getItem('notifications-user-disabled') === 'true';
          
          if (userDisabled) {
            return;
          }

          const { default: pushService } = await import('./services/pushNotification.js');
          const isSubscribed = await pushService.checkAndResubscribe();
          
          if (isSubscribed) {
            
          } else {
            
          }
        }
      } catch (err) {
        console.error('Visibility check error:', err);
      }
    }
  });
} else {
  console.warn('[Service Worker] Not supported in this browser');
}
